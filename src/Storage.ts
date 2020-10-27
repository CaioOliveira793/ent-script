import PropertyType, { PropertyTypeToSize } from './PropertyTypes';


export interface ComponentSchema {
	[propertyName: string]: PropertyType;
}

export interface PoolSettings {
	initialCount: number;
	increaseCount: number;
}

export interface ComponentConstructor extends Function {
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

export const MAX_COMPONENTS = 32;


class Storage {
	constructor(componentConstructors: ComponentConstructor[]) {
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

		// this.componentsMaskByEntity = [];
		// this.entityIdIncrement = 0;
	}

	// component ///////////////////////////////////////////////


	// utils ///////////////////////////////////////////////////

	public getComponentInfo = (component: ComponentConstructor): ComponentInfo => {
		const poolIndex = this.componentTranslationTable[component.name].index;

		return {
			name: component.name,
			size: this.pools[poolIndex].componentSize,
			properties: this.pools[poolIndex].componentLayout
		};
	}

	public getPoolInfo = (component: ComponentConstructor): PoolInfo => {
		const poolIndex = this.componentTranslationTable[component.name].index;

		return {
			componentReference: component.name,
			allocatedSize: this.pools[poolIndex].buffer.byteLength,
			usedSize: this.pools[poolIndex].usedSize,
			increaseSize: this.pools[poolIndex].increaseSize
		};
	}


	/// private members ////////////////////////////////////////

	private createPools = (component: ComponentConstructor, poolIndex: number): void => {
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


	private readonly pools: Pool[];
	// private readonly componentsMaskByEntity: number[];

	private readonly componentTranslationTable: {
		[key: string]: {
			mask: number;
			index: number;
		}
	};

	// private entityIdIncrement: number;
}

export default Storage;
