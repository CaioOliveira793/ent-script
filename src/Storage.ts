import PropertyType, { PropertyTypeToSize } from './PropertyTypes';


export interface ComponentSchema {
	[propertyName: string]: PropertyType;
}

export interface PoolSettings {
	initialCount: number;
	increaseCount: number;
}

export interface ComponentConstructor<T> extends Function {
	new(...args: unknown[]): T;
	schema: ComponentSchema;
	poolSettings?: PoolSettings;
}

interface ComponentProperty {
	readonly name: string;
	readonly type: PropertyType;
	readonly size: number;
	readonly offset: number;
}

export interface ComponentInfo {
	readonly name: string;
	readonly size: number;
	readonly properties: ComponentProperty[];
}

interface Pool {
	buffer: ArrayBuffer;
	readonly componentSize: number;
	readonly componentLayout: ComponentProperty[];
	usedSize: number;
	increaseSize: number;
	freeSections: number[];
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

export const LITTLE_ENDIAN = ((): boolean => {
	const buffer = new ArrayBuffer(2);
	new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
	return new Int16Array(buffer)[0] === 256;
})();

export const MAX_COMPONENTS = 32;


class Storage {
	constructor(componentConstructors: ComponentConstructor<unknown>[]) {
		const totalComponents = componentConstructors.length;

		if (totalComponents <= 0) throw new Error('no component was supplied in the Storage constructor');
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
			this.createPools(component, index);
			index++;
		}

		this.entities = [];
		this.entityIdIncrement = 0;
	}

	// entity //////////////////////////////////////////////////

	public create = (): number => {
		this.entities[this.entityIdIncrement] = {
			componentMask: 0,
			componentPoolOffset: []
		};
		return this.entityIdIncrement++;
	}

	public destroy = (entity: number): boolean => {
		if (!this.entities[entity])
			return false;

		const componentsInEntity = this.generatorIndexInMask(
			(this.entities[entity] as EntityData).componentMask);

		for (const componentIndex of componentsInEntity) {
			const poolOffset = (this.entities[entity] as EntityData).componentPoolOffset[componentIndex];
			poolOffset;

			// free buffer region (poolOffset, poolOffset + this.pools[componentIndex].componentSize)
		}

		this.entities[entity] = null;
		return true;
	}

	public isExistentEntity = (entity: number): boolean => {
		return !!this.entities[entity];
	}


	// component ///////////////////////////////////////////////

	public insert = <T>(entity: number, component: ComponentConstructor<T>, ...args: unknown[]): T => {
		if (!this.entities[entity])
			throw new Error('can not insert a component in a non-crated entity');

		const componentData = new component(...args);
		const componentIndex = this.componentTranslationTable[component.name].index;

		const poolOffset = (this.entities[entity] as EntityData).componentPoolOffset[componentIndex] ?? this.pools[componentIndex].usedSize;

		// increase buffer size:
		if (this.pools[componentIndex].buffer.byteLength === poolOffset) {
			const newLargerBuffer = new ArrayBuffer(this.pools[componentIndex].usedSize + this.pools[componentIndex].increaseSize);
			const oldBufferView = new Uint8Array(this.pools[componentIndex].buffer);
			(new Uint8Array(newLargerBuffer)).set(oldBufferView);

			this.pools[componentIndex].buffer = newLargerBuffer;
		}

		// update the pool used size:
		this.pools[componentIndex].usedSize += this.pools[componentIndex].componentSize;

		// update the entity if it's a new component:
		if ((this.entities[entity] as EntityData).componentPoolOffset[componentIndex] === undefined) {
			(this.entities[entity] as EntityData).componentMask |= this.componentTranslationTable[component.name].mask;
			(this.entities[entity] as EntityData).componentPoolOffset[componentIndex] = poolOffset;
		}

		const poolView = new DataView(this.pools[componentIndex].buffer, poolOffset, this.pools[componentIndex].componentSize);
		const componentRef = this.createComponentRef<T>(poolView, this.pools[componentIndex].componentLayout);
		for (const prop in componentRef) componentRef[prop] = componentData[prop];

		return componentRef;
	}

	public retrieve = <T>(entity: number, component: ComponentConstructor<T>): T => {
		if (!this.entities[entity])
			throw new Error('can not retrieve a component of a non-crated entity');

		const componentIndex = this.componentTranslationTable[component.name].index;
		const poolOffset = (this.entities[entity] as EntityData).componentPoolOffset[componentIndex];

		if (poolOffset === undefined)
			throw new Error(`entity does not have component ${component.name} to retrieve`);

		const poolView = new DataView(this.pools[componentIndex].buffer, poolOffset, this.pools[componentIndex].componentSize);
		return this.createComponentRef<T>(poolView, this.pools[componentIndex].componentLayout);
	}

	public remove = <T>(entity: number, component: ComponentConstructor<T>): void => {
		if (!this.entities[entity])
			throw new Error('can not delete a component of a non-crated entity');

		const componentIndex = this.componentTranslationTable[component.name].index;
		const poolOffset = (this.entities[entity] as EntityData).componentPoolOffset[componentIndex];

		// if there is no component in the entity:
		if (poolOffset === undefined) return;

		(this.entities[entity] as EntityData).componentMask ^= this.componentTranslationTable[component.name].mask;
		(this.entities[entity] as EntityData).componentPoolOffset[componentIndex] = undefined as unknown as number;

		this.pools[componentIndex].freeSections.push(poolOffset);
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

	private createPools = (component: ComponentConstructor<unknown>, poolIndex: number): void => {
		let componentSize = 0;
		const componentLayout: ComponentProperty[] = [];

		for (const propertyName in component.schema) {
			const propertySize = PropertyTypeToSize[component.schema[propertyName]];
			componentLayout.push({
				name: propertyName,
				type: component.schema[propertyName],
				size: propertySize,
				offset: componentSize
			});
			componentSize += propertySize;
		}

		this.pools[poolIndex] = {
			buffer: new ArrayBuffer((component.poolSettings?.initialCount ?? 10) * componentSize),
			componentSize,
			componentLayout,
			usedSize: 0,
			increaseSize: (component.poolSettings?.increaseCount ?? 10) * componentSize,
			freeSections: []
		};
	}

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
		const lastBit = mask & 1;

		for (let index = 0; index < 32; index++) {
			if (lastBit === 1)
				yield index;
			mask >> 1;
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

export default Storage;
