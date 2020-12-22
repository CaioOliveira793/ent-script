import Group from "./Group";
import Reference from "./Reference";
import indexInMask from "./generators/indexInMask";
import { Entity, ComponentConstructor, EntComponentTypes } from './EntTypes';


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
	[componentName: string]: unknown[];
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

		this.entityMaskList = [];
		this.recycledEntityIdList = [];
		this.nextEntityId = 0;

		this.emptyEntityIdList = [];
		this.groupsMap = new Map();
	}

	// entity //////////////////////////////////////////////////
	public createEntities = (entityCount = 1): Entity[] => {
		const entityIdList = this.createEntityIds(entityCount);
		for (const entity of entityIdList) {
			this.entityMaskList[entity] = { mask: 0 };
		}
		this.emptyEntityIdList.push(...entityIdList);
		return entityIdList.map(id => ({ id, mask: 0 }));
	}

	public createEntitiesWithComponents = (componentsConstructor: ComponentList, entityCount = 1): Entity[] => {
		// TODO: handle shared, tag, blob components
		let mask = 0;
		for (const component in componentsConstructor)
			mask |= this.componentsMap.get(component)!.mask;

		const entityIdList = this.createEntityIds(entityCount),
			group = this.returnOrCreateGroup(mask),
			componentsDataList = [],
			refsList = [];
		
		for (const entity of entityIdList) {
			this.entityMaskList[entity] = { mask };
		}

		for (const componentName in componentsConstructor) {
			const constructor = this.componentConstructorMap.get(componentName) as ComponentConstructor<EntComponentTypes>;
			componentsDataList.push(new constructor(...componentsConstructor[componentName]));
			refsList.push(this.refsMap.get(componentName) as Reference<EntComponentTypes>);
		}
		const componentsDataBuffer = this.createComponentData(refsList, componentsDataList, group.getComponentsSize());
		group.setMultipleSections(entityIdList, componentsDataBuffer);
		return entityIdList.map(id => ({ id, mask }));
	}

	public destroyEntities = (entities: Entity[]): void => {
		const maskSet: Set<number> = new Set();
		for (const entity of entities) {
			this.recycledEntityIdList.push(entity.id);
			const mask = this.entityMaskList[entity.id].mask;
			const group = this.groupsMap.get(mask) as Group;
			group.deleteSection(entity.id);
			maskSet.add(mask);
			this.entityMaskList[entity.id] = undefined as unknown as { mask: number };
		}
		for (const mask of maskSet) {
			if (this.groupsMap.get(mask)!.getSectionCount() === 0)
				this.groupsMap.delete(mask);
		}
	}

	// public destroyEntityByQuery(entityQuery: EntityQuery): void;

	
	// entity utils ////////////////////////////////////////////
	public isExistentEntity = (entity: Entity): boolean =>
		!(this.nextEntityId >= entity.id || this.recycledEntityIdList.includes(entity.id));

	public isValidEntity = (entity: Entity): boolean =>
		(this.isExistentEntity(entity) && entity.mask === this.entityMaskList[entity.id].mask);

	public hasComponents = (entity: Entity, componentsName: string[]): boolean[] => {
		const hasComponentList = [];
		for (const component of componentsName) {
			const mask = this.componentsMap.get(component)!.mask;
			hasComponentList.push((this.entityMaskList[entity.id].mask & mask) === mask);
		}
		return hasComponentList;
	}

	public getComponentCount = (entity: Entity): number => {
		let mask = this.entityMaskList[entity.id].mask, count = 0;
		while (mask !== 0) {
			if ((mask & 1) === 1) count++;
			mask >>= 1;
		}
		return count;
	}


	// component ///////////////////////////////////////////////
	public addComponentsInEntities = (entities: Entity[], componentsConstructor: ComponentList): void => {
		const addedComponentsIndex = [];
		let mask = 0;
		for (const component in componentsConstructor) {
			mask |= this.componentsMap.get(component)!.mask;
			addedComponentsIndex.push()
		}

		for (const entity of entities) {
			const oldMask = this.entityMaskList[entity.id].mask;
			const newMask = this.entityMaskList[entity.id].mask |= mask;

			const oldGroup = this.groupsMap.get(oldMask) as Group,
				oldComponentDataView = new Uint8Array(oldGroup.getSectionData(entity.id)),
				newGroup = this.returnOrCreateGroup(newMask);

			oldGroup.deleteSection(entity.id);
			const { view, offset: chunkOffset, remainingOrderedComponentInfo } = newGroup.setSectionData(
				entity.id,
				oldGroup.getOrderedComponentInfo(),
				oldComponentDataView
			);

			for (const componentInfo of remainingOrderedComponentInfo) {
				const componentName = this.componentList[componentInfo.index].name,
					constructor = this.componentConstructorMap
						.get(componentName) as ComponentConstructor<EntComponentTypes>,
					component = new constructor(...componentsConstructor[componentName]) as { [key: string]: unknown },
					ref = this.refsMap.get(componentName) as Reference<{ [key: string]: unknown }>;

				ref.updateView(view, chunkOffset + componentInfo.offset);
				const componentRef = ref.get();
				for (const propName in componentRef)
					componentRef[propName] = component[propName];
			}
		}
	}

	// public addComponentsInEntityQuery(entityQuery: EntityQuery, components: ComponentConstructor<unknown>[]): void;

	// // public addSharedComponent(entities: Entity[], components: ComponentConstructor<unknown>[]): void;
	// // public addSharedComponent(entityQuery: EntityQuery, components: ComponentConstructor<unknown>[]): void;

	// public removeComponentsInEntities = (entities: Entity[], componentsName: string[]): void => {}
	// public removeComponentsInEntityQuery(entityQuery: EntityQuery, components: ComponentConstructor<unknown>[]): void;

	// public setGroup(entity: Entity, Group: GroupType): void;

	// public createCommandManager(): CommandManager;
	// public setCommandBuffer(commandBuffer: CommandBuffer): void;


	////////////////////////////////////////////////////////////
	// private /////////////////////////////////////////////////

	private createEntityIds = (count = 1): number[] => {
		if (count === 1) {
			const id = this.recycledEntityIdList.pop() ?? this.nextEntityId++;
			return [id];
		}

		const createdEntitiesList = [];
		const nextEntityIdStopValue = count + this.nextEntityId - this.recycledEntityIdList.length;
		while (this.nextEntityId < nextEntityIdStopValue)
			createdEntitiesList.push(this.nextEntityId++);
		createdEntitiesList.push(...this.recycledEntityIdList.slice(0, count));
		this.recycledEntityIdList.length = Math.max(0, this.recycledEntityIdList.length - count);

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
			refs[i].updateView(view, offset);
			const componentRef = refs[i].get();
			for (const prop in componentRef)
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
	private readonly entityMaskList: { mask: number }[];
	private readonly recycledEntityIdList: number[];
	private nextEntityId: number;

	// groups
	private readonly emptyEntityIdList: number[];
	private readonly groupsMap: Map<number, Group>;
}


export default EntManager;
