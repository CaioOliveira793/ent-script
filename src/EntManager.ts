import Group from "./Group";
import Reference from "./Reference";
import { Entity, ComponentConstructor, EntComponentTypes } from './EntTypes';
import indexInMask from "./generators/indexInMask";


export interface ComponentMapProps {
	mask: number;
	index: number;
	size: number;
}

export interface ComponentListProps {
	name: string;
	size: number;
}


export interface ComponentList {
	[componentName: string]: [...unknown[]];
}

export interface EntManagerExposedData {
	refsMap: Map<string, Reference<unknown>>;
	componentsMap: Map<string, ComponentMapProps>;
	groupsMap: Map<number, Group>;
}


class EntManager {
	constructor(components: ComponentConstructor<EntComponentTypes>[]) {
		this.refsMap = new Map();
		this.componentsMap = new Map();
		this.componentList = [];
		this.componentConstructorMap = new Map();

		let index = 0, mask = 1;
		// TODO: sort the components to unique, shared and blob
		for (const component of components) {
			mask = 1 << index;
			const ref = new Reference<EntComponentTypes>(component.schema);
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
			this.componentConstructorMap.set(component.name, component);
			index++;
		}

		this.entityList = [];
		this.recycledEntities = [];
		this.nextEntity = 0;

		this.emptyEntities = [];
		this.groupsMap = new Map();
	}

	public createEntities = (entityCount = 1): Entity[] => {
		const entityList = this.createEntitiesAndPushInList(entityCount);
		this.emptyEntities.push(...entityList);
		return entityList;
	}

	public createEntitiesWithComponents = (componentsConstructor: ComponentList, entityCount = 1): Entity[] => {
		const entityList = this.createEntitiesAndPushInList(entityCount);

		// TODO: handle shared, tag, blob components
		let mask = 0;
		for (const component in componentsConstructor)
			mask |= this.componentsMap.get(component)!.mask;

		const group = this.returnOrCreateGroup(mask);

		const componentsDataList = [];
		const refsList = [];
		for (const componentName in componentsConstructor) {
			const constructor = this.componentConstructorMap.get(componentName) as ComponentConstructor<EntComponentTypes>;
			componentsDataList.push(new constructor(...componentsConstructor[componentName]));
			refsList.push(this.refsMap.get(componentName) as Reference<EntComponentTypes>);
		}
		const componentsDataBuffer = this.createComponentData(refsList, componentsDataList, group.getComponentsSize());
		group.setMultipleSections(entityList, componentsDataBuffer);
		return entityList;
	}


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

	private createEntitiesAndPushInList = (count = 1): Entity[] => {
		if (count === 1) {
			const entity = this.recycledEntities.pop() ?? this.nextEntity++;
			this.entityList.push(entity);
			return [entity];
		}

		const createdEntitiesList = [];
		const nextEntityStopValue = count + this.nextEntity - this.recycledEntities.length;
		while (this.nextEntity < nextEntityStopValue)
			createdEntitiesList.push(this.nextEntity++);
		createdEntitiesList.push(...this.recycledEntities.slice(0, count));
		this.recycledEntities.length = Math.max(0, this.recycledEntities.length - count);

		this.entityList.push(...createdEntitiesList);
		return createdEntitiesList;
	}

	private createComponentData = <T>(refs: Reference<T>[], componentsData: T[], size?: number): ArrayBuffer => {
		let bufferSize = size ?? 0;
		if (bufferSize !== size)
			for (const ref of refs) bufferSize += ref.getSize();
		const componentDataBuffer = new ArrayBuffer(bufferSize);
		const view = new DataView(componentDataBuffer);

		let offset = 0;
		for (let i = 0; i < refs.length; i++) {
			refs[i].updateView(view);
			refs[i].updateOffset(offset);
			const componentRef = refs[i].get();
			for (const prop in componentsData[i])
				componentRef[prop] = componentsData[i][prop];
			offset += refs[i].getSize();
		}
		return componentDataBuffer;
	}

	private returnOrCreateGroup = (mask: number): Group => {
		let group = this.groupsMap.get(mask) as Group;
		if (!group) {
			const componentsInfo = [];
			const indexIterator = indexInMask(mask);
			for (const index of indexIterator) {
				componentsInfo.push({
					index: index,
					mask: 1 << index,
					size: this.componentList[index].size
				});
			}
			group = new Group(componentsInfo);
			this.groupsMap.set(mask, group);
		}
		return group;
	}

	// components
	private readonly refsMap: Map<string, Reference<EntComponentTypes>>;
	private readonly componentsMap: Map<string, ComponentMapProps>;
	private readonly componentList: ComponentListProps[];
	private readonly componentConstructorMap: Map<string, ComponentConstructor<EntComponentTypes>>;

	// entity data
	private readonly entityList: Entity[];
	private readonly recycledEntities: Entity[];
	private nextEntity: number;

	// groups
	private readonly emptyEntities: Entity[];
	private readonly groupsMap: Map<number, Group>;
}


export default EntManager;
