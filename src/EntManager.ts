import Group from "./Group";
import Reference from "./Reference";
import { Entity, ComponentConstructor, EntComponent, EntSharedComponent } from './EntTypes';


interface ComponentInfo {
	size: number;
}

export interface ComponentIdAndInfo extends ComponentInfo {
	mask: number;
	index: number;
}

export interface ComponentNameAndInfo extends ComponentInfo {
	name: string;
}


export interface EntManagerExposedData {
	refsMap: Map<string, Reference<unknown>>;
	componentsMap: Map<string, ComponentIdAndInfo>;
	groupsMap: Map<number, Group>;
}


class EntManager {
	constructor(components: ComponentConstructor<EntComponent | EntSharedComponent>[]) {
		this.refsMap = new Map();
		this.componentsMap = new Map();
		this.componentList = [];

		let index = 0, mask = 1;
		// TODO: sort the components to unique, shared and blob
		for (const component of components) {
			mask = 1 << index;
			const ref = new Reference<EntComponent | EntSharedComponent>(component.schema);
			this.refsMap.set(component.name, ref);
			this.componentsMap.set(component.name, {
				mask,
				index,
				size: ref.getSize()
			});
			this.componentList.push({
				name: component.name,
				size: ref.getSize()
			});
			index++;
		}

		this.entityList = [];
		this.recycledEntities = [];
		this.nextEntity = 0;

		this.emptyEntities = [];
		this.groupsMap = new Map();
	}

	// TODO: add method to return multiples entities
	public createEntity = (): Entity => {
		const entity = this.recycledEntities.pop() ?? this.nextEntity++;
		this.entityList.push(entity);
		this.emptyEntities.push(entity);
		return entity;
	}

	public createEntityWithComponents = (components: ComponentConstructor<EntComponent | EntSharedComponent>[]): Entity => {
		const entity = this.recycledEntities.pop() ?? this.nextEntity++;
		this.entityList.push(entity);

		// TODO: handle shared, tag, blob components
		let mask = 0;
		for (const component of components) {
			mask |= this.componentsMap.get(component.name)!.mask;
		}

		const group = this.groupsMap.get(mask);
		if (group) {
			this.groupsMap.set(mask, new Group(components.map((component) => {
				const componentData = this.componentsMap.get(component.name) as ComponentIdAndInfo;
				return {
					index: componentData.index,
					mask: componentData.mask,
					size: componentData.size
				};
			})));
		}

		const { view, offset } = group!.setComponents(entity);
		for (const component of components) {
			const ref = this.refsMap.get(component.name) as Reference<{ [key: string]: unknown }>;
			ref.updateView(view);
			ref.updateOffset(offset);
			const componentRef = ref.get();
			const componentData = new component() as unknown as { [key: string]: unknown };
			for (const prop in componentData) {
				componentRef[prop] = componentData[prop];
			}
		}

		return entity;
	}

	// public createEntitywithGroup(group: GroupType, entityCount: number = 1): Entity[];


	// public destroyEntity(entity: Entity): void;
	// public destroyEntityByList(entities: Entity[]): void;
	// public destroyEntityByQuery(entityQuery: EntityQuery): void;

	// public isValid(entity: Entity): void;
	// public hasComponents(entity: Entity, components: ComponentConstructor<unknown>[]): boolean;
	// public getComponentCount(entity: Entity): void;
	// public getEntityMask(entity: Entity): number;

	// public addComponentsInEntity(entities: Entity[], components: ComponentConstructor<unknown>[]): void;
	// public addComponentsInEntityQuery(entityQuery: EntityQuery, components: ComponentConstructor<unknown>[]): void;

	// // public addSharedComponent(entity: Entity, components: ComponentConstructor<unknown>[]): void;
	// // public addSharedComponent(entities: Entity[], components: ComponentConstructor<unknown>[]): void;
	// // public addSharedComponent(entityQuery: EntityQuery, components: ComponentConstructor<unknown>[]): void;

	// public removeComponentsInEntity(entity: Entity, components: ComponentConstructor<unknown>[]): void;
	// public removeComponentsInEntityList(entities: Entity[], components: ComponentConstructor<unknown>[]): void;
	// public removeComponentsInEntityQuery(entityQuery: EntityQuery, components: ComponentConstructor<unknown>[]): void;

	// public setGroup(entity: Entity, Group: GroupType): void;

	// public createCommandManager(): CommandManager;
	// public setCommandBuffer(commandBuffer: CommandBuffer): void;


	////////////////////////////////////////////////////////////
	// private /////////////////////////////////////////////////

	// components
	private readonly refsMap: Map<string, Reference<EntComponent | EntSharedComponent>>;
	private readonly componentsMap: Map<string, ComponentIdAndInfo>;
	private readonly componentList: ComponentNameAndInfo[];

	// entity data
	private readonly entityList: Entity[];
	private readonly recycledEntities: Entity[];
	private nextEntity: number;

	// groups
	private readonly emptyEntities: Entity[];
	private readonly groupsMap: Map<number, Group>;
}


export default EntManager;
