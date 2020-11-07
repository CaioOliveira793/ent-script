import PropertyType, { PropertyTypeToSize } from './PropertyTypes';


export interface PoolSchema {
	[propertyName: string]: PropertyType;
}

export interface PoolSettings {
	initialCount: number;
	increaseCount: number;
}

export interface ComponentProperty {
	readonly name: string;
	readonly type: PropertyType;
	readonly size: number;
	readonly offset: number;
}


class Pool {
	constructor(schema: PoolSchema, settings?: PoolSettings) {
		let componentSize = 0;
		const componentLayout: ComponentProperty[] = [];

		for (const propertyName in schema) {
			const propertySize = PropertyTypeToSize[schema[propertyName]];
			componentLayout.push({
				name: propertyName,
				type: schema[propertyName],
				size: propertySize,
				offset: componentSize
			});
			componentSize += propertySize;
		}

		this.buffer = new ArrayBuffer((settings?.initialCount ?? 10) * componentSize);
		this.componentSize = componentSize;
		this.componentLayout = componentLayout;
		this.usedSize = 0;
		this.increaseSize = (settings?.increaseCount ?? 10) * componentSize;
		this.freeSections = [];
	}

	public buffer: ArrayBuffer;
	public readonly componentSize: number;
	public readonly componentLayout: ComponentProperty[];
	public usedSize: number;
	public increaseSize: number;
	public freeSections: number[];
}

export default Pool;
