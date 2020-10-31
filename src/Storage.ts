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
	readonly size: number;
	readonly offset: number;
}

export interface ComponentInfo {
	name: string;
	size: number;
	properties: ComponentProperty[];
}

interface Pool {
	buffer: ArrayBuffer;
	readonly componentSize: number;
	readonly componentLayout: ComponentProperty[];
	usedSize: number;
	increaseSize: number;
}

export interface PoolInfo {
	componentReference: string;
	allocatedSize: number;
	usedSize: number;
	increaseSize: number;
}

interface EntityData {
	componentMask: number;
	componentPoolOffset: number[];
}


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
		if (!this.entities[entity]) throw new Error('can not insert a component in a non crated entity');

		const componentData = new component(...args) as unknown as { [key: string]: number | bigint };
		const componentIndex = this.componentTranslationTable[component.name].index;

		let poolOffset = (this.entities[entity] as EntityData).componentPoolOffset[componentIndex];

		if (!(this.entities[entity] as EntityData).componentPoolOffset[componentIndex]) {
			poolOffset = this.pools[componentIndex].usedSize;

			// increase buffer size:
			if (this.pools[componentIndex].buffer.byteLength === this.pools[componentIndex].usedSize) {
				const newBuffer = new ArrayBuffer(this.pools[componentIndex].usedSize + this.pools[componentIndex].increaseSize);
				const uInt32NewBuffer = new Uint32Array(newBuffer);
				const uInt32OldBuffer = new Uint32Array(this.pools[componentIndex].buffer);

				for (let i = 0; i < uInt32OldBuffer.length; i++) {
					uInt32NewBuffer[i] = uInt32OldBuffer[i];
				}
			}
		}

		const poolView = new DataView(this.pools[componentIndex].buffer);

		// for every property in the component:
		for (const layout of this.pools[componentIndex].componentLayout) {
			// TODO: add type in ComponentProperty interface
			switch (layout.size) {
				case 8:
					poolView.setUint8(layout.offset + poolOffset, componentData[layout.name] as number);
					break;
				case 16:
					poolView.setUint16(layout.offset + poolOffset, componentData[layout.name] as number);
					break;
				case 32:
					poolView.setUint32(layout.offset + poolOffset, componentData[layout.name] as number);
					break;
				case 64:
					poolView.setBigUint64(layout.offset + poolOffset, componentData[layout.name] as bigint);
					break;
			}
		}

		// updating the entity:
		(this.entities[entity] as EntityData).componentMask |= this.componentTranslationTable[component.name].mask;
		(this.entities[entity] as EntityData).componentPoolOffset[componentIndex] = this.pools[componentIndex].usedSize;

		// updating the pool:
		this.pools[componentIndex].usedSize += this.pools[componentIndex].componentSize;

		// TODO: return a component reference to the poll
		return componentData as unknown as T;
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
			increaseSize: this.pools[poolIndex].increaseSize
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
			increaseSize: (component.poolSettings?.increaseCount ?? 10) * componentSize
		};
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
