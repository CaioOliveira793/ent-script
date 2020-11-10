import Pool, { PoolSettings, PoolSchema, PoolInfo, PoolSectionLayout } from './Pool';
import indexInMask from './generators/IndexInMask';

export type ComponentSchema = PoolSchema;

export interface ComponentConstructor<T> extends Function {
	new(...args: unknown[]): T;
	schema: PoolSchema;
	poolSettings?: PoolSettings;
}

export interface ComponentInfo {
	readonly name: string;
	readonly size: number;
	readonly properties: PoolSectionLayout[];
}

interface EntityData {
	componentMask: number;
	componentPoolOffset: number[];
}

interface CompoenentLookupTable {
	[key: string]: { mask: number; index: number; }
}

export const REGISTRY_MAX_COMPONENTS = 32;


export class Registry {
	constructor(componentConstructors: ComponentConstructor<unknown>[]) {
		const totalComponents = componentConstructors.length;

		if (totalComponents <= 0) throw new Error('no component was supplied in the Registry constructor');
		if (totalComponents > REGISTRY_MAX_COMPONENTS) throw new Error('max number of 32 components was exceeded');

		this.pools = Array(totalComponents);
		this.compoenentLookupTable = {};

		let index = 0;
		let mask = 1;
		for (const component of componentConstructors) {
			// set the component mask:
			mask <<= index;
			this.compoenentLookupTable[component.name] = { mask, index };

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

		const componentsInEntity = indexInMask(this.entities[entity].componentMask);
		for (const componentIndex of componentsInEntity) {
			const poolOffset = this.entities[entity].componentPoolOffset[componentIndex];
			this.pools[componentIndex].deleteSection(poolOffset);
		}

		this.entities[entity] = undefined as unknown as EntityData;
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
		const componentIndex = this.compoenentLookupTable[component.name].index;

		const existentPoolOffset = this.entities[entity]?.componentPoolOffset[componentIndex];
		if (existentPoolOffset !== undefined) {
			const componentReference = this.pools[componentIndex].getSectionReference<T>(existentPoolOffset);
			for (const prop in componentReference)
				componentReference[prop] = componentData[prop];
			return componentReference;
		}

		const { sectionReference, offset } = this.pools[componentIndex].insertSection<T>(componentData);

		this.entities[entity].componentMask |= this.compoenentLookupTable[component.name].mask;
		this.entities[entity].componentPoolOffset[componentIndex] = offset;

		return sectionReference;
	}

	public hasComponent = <T>(entity: number, component: ComponentConstructor<T>): boolean => {
		return (this.entities[entity].componentMask & this.compoenentLookupTable[component.name].mask)
			=== this.compoenentLookupTable[component.name].mask;
	}

	public getComponent = <T>(entity: number, component: ComponentConstructor<T>): T => {
		if (!this.entities[entity])
			throw new Error('can not retrieve a component of a non-crated entity');

		const componentIndex = this.compoenentLookupTable[component.name].index;
		const poolOffset = this.entities[entity].componentPoolOffset[componentIndex];

		if (poolOffset === undefined)
			throw new Error(`entity does not have component ${component.name} to retrieve`);

		return this.pools[componentIndex].getSectionReference(poolOffset);
	}

	public removeComponent = <T>(entity: number, component: ComponentConstructor<T>): boolean => {
		if (!this.entities[entity])
			throw new Error('can not delete a component of a non-crated entity');

		const componentIndex = this.compoenentLookupTable[component.name].index;
		const poolOffset = this.entities[entity].componentPoolOffset[componentIndex];

		if (poolOffset === undefined) return false;

		this.entities[entity].componentMask ^= this.compoenentLookupTable[component.name].mask;
		this.entities[entity].componentPoolOffset[componentIndex] = undefined as unknown as number;

		this.pools[componentIndex].deleteSection(poolOffset);
		return true;
	}


	// utils ///////////////////////////////////////////////////

	public getComponentInfo = (component: ComponentConstructor<unknown>): ComponentInfo => {
		const poolIndex = this.compoenentLookupTable[component.name].index;
		const poolInfo = this.pools[poolIndex].getInfo();

		return {
			name: component.name,
			size: poolInfo.sectionSize,
			properties: poolInfo.sectionLayout
		};
	}

	public getPoolInfo = (component: ComponentConstructor<unknown>): PoolInfo => {
		const poolIndex = this.compoenentLookupTable[component.name].index;
		return this.pools[poolIndex].getInfo();
	}


	private readonly pools: Pool[];
	private readonly entities: EntityData[];

	private readonly compoenentLookupTable: CompoenentLookupTable;

	private entityIdIncrement: number;
}

export default Registry;
