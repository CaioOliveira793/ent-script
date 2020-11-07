import Pool, { PoolSettings, PoolSchema, ComponentProperty } from './Pool';
import PropertyType from './PropertyTypes';
import LITTLE_ENDIAN from './utils/LittleEndian';


export type ComponentSchema = PoolSchema;

export interface ComponentConstructor<T> extends Function {
	new(...args: unknown[]): T;
	schema: PoolSchema;
	poolSettings?: PoolSettings;
}

export interface ComponentInfo {
	readonly name: string;
	readonly size: number;
	readonly properties: ComponentProperty[];
}

export interface PoolInfo {
	readonly componentReference: string;
	readonly allocatedSize: number;
	readonly usedSize: number;
	readonly increaseSize: number;
	readonly freeSections: number[];
}

interface EntityData {
	componentMask: number;
	componentPoolOffset: number[];
}

export const MAX_COMPONENTS = 32;


class Registry {
	constructor(componentConstructors: ComponentConstructor<unknown>[]) {
		const totalComponents = componentConstructors.length;

		if (totalComponents <= 0) throw new Error('no component was supplied in the Registry constructor');
		if (totalComponents > MAX_COMPONENTS) throw new Error('max number of 32 components was exceeded');

		this.pools = Array(totalComponents);
		this.componentTranslationTable = {};

		let index = 0;
		let mask = 1;
		for (const component of componentConstructors) {
			// set the component mask:
			mask <<= index;
			this.componentTranslationTable[component.name] = { mask, index };

			// create pools of components:
			this.pools[index] = new Pool(component.schema, component.poolSettings);
			index++;
		}

		this.entities = [];
		this.entityIdIncrement = 0;
	}

	// entity //////////////////////////////////////////////////

	public createEntity = (): number => {
		this.entities[this.entityIdIncrement] = {
			componentMask: 0,
			componentPoolOffset: []
		};
		return this.entityIdIncrement++;
	}

	public destroyEntity = (entity: number): boolean => {
		if (!this.entities[entity]) return false;

		const componentsInEntity = this.generatorIndexInMask((this.entities[entity] as EntityData).componentMask);
		for (const componentIndex of componentsInEntity) {
			const poolOffset = (this.entities[entity] as EntityData).componentPoolOffset[componentIndex];

			(this.entities[entity] as EntityData).componentMask ^= 1 << (componentIndex - 1);
			(this.entities[entity] as EntityData).componentPoolOffset[componentIndex] = undefined as unknown as number;

			this.pools[componentIndex].freeSections.push(poolOffset);
		}

		this.entities[entity] = null;
		return true;
	}

	public isExistentEntity = (entity: number): boolean => {
		return !!this.entities[entity];
	}


	// component ///////////////////////////////////////////////

	public insertComponent = <T>(entity: number, component: ComponentConstructor<T>, ...args: unknown[]): T => {
		if (!this.entities[entity])
			throw new Error('can not insert a component in a non-crated entity');

		const componentData = new component(...args);
		const componentIndex = this.componentTranslationTable[component.name].index;

		const existentPoolOffset = this.entities[entity]?.componentPoolOffset[componentIndex];
		if (existentPoolOffset !== undefined) {
			const componentReference = this.pools[componentIndex].getComponentReference<T>(existentPoolOffset);
			for (const prop in componentReference)
				componentReference[prop] = componentData[prop];
			return componentReference;
		}

		const { componentReference, poolOffset } = this.pools[componentIndex].insertComponent<T>(componentData);

		(this.entities[entity] as EntityData).componentMask |= this.componentTranslationTable[component.name].mask;
		(this.entities[entity] as EntityData).componentPoolOffset[componentIndex] = poolOffset;

		return componentReference;
	}

	public getComponent = <T>(entity: number, component: ComponentConstructor<T>): T => {
		if (!this.entities[entity])
			throw new Error('can not retrieve a component of a non-crated entity');

		const componentIndex = this.componentTranslationTable[component.name].index;
		const poolOffset = (this.entities[entity] as EntityData).componentPoolOffset[componentIndex];

		if (poolOffset === undefined)
			throw new Error(`entity does not have component ${component.name} to retrieve`);

		const poolView = new DataView(this.pools[componentIndex].buffer, poolOffset, this.pools[componentIndex].componentSize);
		return this.createComponentRef<T>(poolView, this.pools[componentIndex].componentLayout);
	}

	public removeComponent = <T>(entity: number, component: ComponentConstructor<T>): boolean => {
		if (!this.entities[entity])
			throw new Error('can not delete a component of a non-crated entity');

		const componentIndex = this.componentTranslationTable[component.name].index;
		const poolOffset = (this.entities[entity] as EntityData).componentPoolOffset[componentIndex];

		// if there is no component in the entity:
		if (poolOffset === undefined) return false;

		(this.entities[entity] as EntityData).componentMask ^= this.componentTranslationTable[component.name].mask;
		(this.entities[entity] as EntityData).componentPoolOffset[componentIndex] = undefined as unknown as number;

		this.pools[componentIndex].freeSections.push(poolOffset);
		return true;
	}


	// utils ///////////////////////////////////////////////////

	public getComponentInfo = (component: ComponentConstructor<unknown>): ComponentInfo => {
		const poolIndex = this.componentTranslationTable[component.name].index;

		return {
			name: component.name,
			size: this.pools[poolIndex].componentSize,
			properties: this.pools[poolIndex].componentLayout
		};
	}

	public getPoolInfo = (component: ComponentConstructor<unknown>): PoolInfo => {
		const poolIndex = this.componentTranslationTable[component.name].index;

		return {
			componentReference: component.name,
			allocatedSize: this.pools[poolIndex].buffer.byteLength,
			usedSize: this.pools[poolIndex].usedSize,
			increaseSize: this.pools[poolIndex].increaseSize,
			freeSections: this.pools[poolIndex].freeSections
		};
	}


	/// private members ////////////////////////////////////////

	private createComponentRef = <T>(
		poolView: DataView,
		poolLayout: ComponentProperty[]
	): T => {
		const componentRef = {} as T;

		for (const layout of poolLayout) {
			switch (layout.type) {
				case PropertyType.U_INT_8:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getUint8(layout.offset),
						set: (value: number): void => poolView.setUint8(layout.offset, value)
					});
					break;

				case PropertyType.U_INT_16:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getUint16(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setUint16(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.U_INT_32:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getUint32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setUint32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.U_INT_64:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): bigint => poolView.getBigUint64(layout.offset, LITTLE_ENDIAN),
						set: (value: bigint): void => poolView.setBigUint64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_8:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getInt8(layout.offset),
						set: (value: number): void => poolView.setInt8(layout.offset, value),
					});
					break;

				case PropertyType.INT_16:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getInt16(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setInt16(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_32:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getInt32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setInt32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_64:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): bigint => poolView.getBigInt64(layout.offset, LITTLE_ENDIAN),
						set: (value: bigint): void => poolView.setBigInt64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.FLOAT_32:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getFloat32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setFloat32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.FLOAT_64:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getFloat64(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setFloat64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;
			}
		}

		return componentRef;
	}

	private * generatorIndexInMask(mask: number): Generator<number, void, unknown> {
		for (let index = 0; index < 32; index++) {
			if ((mask & 1) === 1)
				yield index;
			mask >>= 1;
		}
	}


	private readonly pools: Pool[];
	private readonly entities: (EntityData | null)[];

	private readonly componentTranslationTable: {
		[key: string]: {
			mask: number;
			index: number;
		}
	};

	private entityIdIncrement: number;
}

export default Registry;
