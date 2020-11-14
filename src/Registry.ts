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
	componentCount: number;
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
			mask <<= index;
			this.compoenentLookupTable[component.name] = { mask, index };

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
			componentCount: 0
		};
		return this.entityIdIncrement++;
	}

	public destroyEntity = (entity: number): boolean => {
		if (!this.entities[entity]) return false;

		const componentsInEntity = indexInMask(this.entities[entity].componentMask);
		for (const componentIndex of componentsInEntity) {
			this.pools[componentIndex].deleteSection(entity);
		}

		this.entities[entity] = undefined as unknown as EntityData;
		return true;
	}

	public isExistentEntity = (entity: number): boolean => {
		return !!this.entities[entity];
	}

	public getEntityComponentCount = (entity: number): number => {
		if (!this.entities[entity])
			throw new Error('can not retrieve component count of a non-crated entity');
		
		return this.entities[entity].componentCount;
	}

	public* getEntitiesIteratorWith(components: ComponentConstructor<unknown>[]): Generator<number, void, unknown> {
		if (components.length <= 0)
			throw new Error('no component was supplied to retrive the entity iterator');

		const poolIndexes = components
			.map(constructors => this.compoenentLookupTable[constructors.name].index);

		let smallerPoolIndex = poolIndexes[0];
		let queryMask = 0;
		for (const index of poolIndexes) {
			queryMask |= 1 << index;
			smallerPoolIndex = (this.pools[smallerPoolIndex].getSectionCount()
				<= this.pools[index].getSectionCount()) ? smallerPoolIndex : index;
		}

		const entitiesIterator = this.pools[smallerPoolIndex].getKeysIterator();
		for (const entity of entitiesIterator) {
			if ((this.entities[entity].componentMask & queryMask) === queryMask)
				yield entity;
		}
	}


	// component ///////////////////////////////////////////////

	public insertComponent = <T>(entity: number, component: ComponentConstructor<T>, ...args: unknown[]): T => {
		if (!this.entities[entity])
			throw new Error('can not insert a component in a non-crated entity');

		const componentData = new component(...args);
		const componentId = this.compoenentLookupTable[component.name];

		if ((this.entities[entity].componentMask & componentId.mask) === componentId.mask) {
			const componentReference = this.pools[componentId.index].getSectionReference<T>(entity);
			for (const prop in componentReference)
				componentReference[prop] = componentData[prop];
			return componentReference;
		}

		this.entities[entity].componentMask |= this.compoenentLookupTable[component.name].mask;
		this.entities[entity].componentCount++;
		return this.pools[componentId.index].insertSection<T>(entity, componentData);
	}

	public hasComponent = <T>(entity: number, component: ComponentConstructor<T>): boolean => {
		const componentMask = this.compoenentLookupTable[component.name].mask;
		return (this.entities[entity].componentMask & componentMask) === componentMask;
	}

	public getComponent = <T>(entity: number, component: ComponentConstructor<T>): T => {
		if (!this.entities[entity])
			throw new Error('can not retrieve a component of a non-crated entity');

		const componentId = this.compoenentLookupTable[component.name];

		if ((this.entities[entity].componentMask & componentId.mask) !== componentId.mask)
			throw new Error(`entity does not have component ${component.name} to retrieve`);

		return this.pools[componentId.index].getSectionReference(entity);
	}

	public removeComponent = <T>(entity: number, component: ComponentConstructor<T>): boolean => {
		if (!this.entities[entity])
			throw new Error('can not remove a component of a non-crated entity');

		const componentId = this.compoenentLookupTable[component.name];

		if ((this.entities[entity].componentMask & componentId.mask) !== componentId.mask) return false;

		this.entities[entity].componentMask ^= componentId.mask;
		this.entities[entity].componentCount--;
		this.pools[componentId.index].deleteSection(entity);
		return true;
	}

	public clearComponents = <T>(component: ComponentConstructor<T>): number => {
		const componentId = this.compoenentLookupTable[component.name];
		const entitiesIterable = this.pools[componentId.index].getKeysIterator();

		for (const entity of entitiesIterable) {
			this.entities[entity].componentMask ^= componentId.mask;
			this.entities[entity].componentCount--;
		}

		return this.pools[componentId.index].deleteAllSections();
	}

	public clearAllComponents = (): number => {
		for (const entityData of this.entities) {
			entityData.componentMask = 0;
			entityData.componentCount--;
		}

		let deletedComponents = 0;
		for (const pool of this.pools) deletedComponents += pool.deleteAllSections();
		return deletedComponents;
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
	private entities: EntityData[];
	private readonly compoenentLookupTable: CompoenentLookupTable;

	private entityIdIncrement: number;
}

export default Registry;
