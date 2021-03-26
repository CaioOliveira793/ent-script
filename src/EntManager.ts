import Group, { GroupComponentInfo } from './Group';
import Reference from './Reference';
import indexInMask from './generators/indexInMask';
import { Entity, EntComponent } from './EntTypes';


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
	[componentName: string]: Record<string, unknown>;
}

interface ComponentInsertionDelta {
	view: DataView;
	offset: number;
	missingComponents: GroupComponentInfo[];
}


class EntManager {
	constructor(
		componentsConstructor: EntComponent[],
		componentsMapView: () => Map<string, ComponentMapProps>,
		refsMapView: () => Map<string, Reference<EntComponent>>,
		groupsMapView: () => Map<number, Group>
	) {
		this.componentsMapView = componentsMapView;
		this.refsMapView = refsMapView;
		this.groupsMapView = groupsMapView;

		this.componentList = [];
		this.componentSpecMap = new Map();

		componentsConstructor.sort((compA, compB) => compA.type - compB.type);

		let index = 0, mask = 1;
		for (const component of componentsConstructor) {
			mask = 1 << index;
			const ref = new Reference<EntComponent>(component.schema);
			this.refsMapView().set(component.name, ref);
			this.componentsMapView().set(component.name, {
				mask,
				index,
				size: ref.getSize()
			});
			this.componentList.push({
				name: component.name,
				size: ref.getSize()
			});
			this.componentSpecMap.set(component.name, component);
			index++;
		}

		this.entityMaskList = [];
		this.recycledEntityIdList = [];
		this.nextEntityId = 0;

		this.emptyEntityIdList = [];
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

	public createEntitiesWithComponents = (components: string[], entityCount = 1): Entity[] => {
		// TODO: handle shared, tag, blob components
		let mask = 0;
		for (const component of components) {
			mask |= this.componentsMapView().get(component)!.mask;
		}

		const entityIdList = this.createEntityIds(entityCount),
			group = this.returnOrCreateGroup(mask);
		
		for (const entity of entityIdList) {
			this.entityMaskList[entity] = { mask };
		}

		// TODO: pass the components buffer to ref
		// TODO: pass the componet refs to the transform function
		const componentsDataBuffer = new ArrayBuffer(group.getComponentsSize());

		group.setMultipleSections(entityIdList, componentsDataBuffer);
		return entityIdList.map(id => ({ id, mask }));
	}

	public destroyEntities = (entities: Entity[]): void => {
		const maskSet: Set<number> = new Set();
		for (const entity of entities) {
			this.recycledEntityIdList.push(entity.id);
			const mask = this.entityMaskList[entity.id].mask;
			this.entityMaskList[entity.id] = undefined as unknown as { mask: number };
			if (mask === 0) continue;
			const group = this.groupsMapView().get(mask) as Group;
			group.deleteSection(entity.id);
			maskSet.add(mask);
		}
		for (const mask of maskSet) {
			if (this.groupsMapView().get(mask)!.getSectionCount() === 0)
				this.groupsMapView().delete(mask);
		}
	}


	// entity utils ////////////////////////////////////////////
	public isExistentEntity = (entity: Entity): boolean =>
		this.entityMaskList[entity.id] != undefined;

	public isValidEntity = (entity: Entity): boolean => (
		this.isExistentEntity(entity) && entity.mask === this.entityMaskList[entity.id].mask
	);

	public hasComponents = (entity: Entity, components: string[]): boolean[] => {
		const hasComponentList = [];
		for (const component of components) {
			const mask = this.componentsMapView().get(component)!.mask;
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
	public addComponentsInEntities = (entities: Entity[], components: string[]): void => {
		let adiccionMask = 0;
		for (const name of components)
			adiccionMask |= this.componentsMapView().get(name)!.mask;

		for (const entity of entities) {
			const oldMask = this.entityMaskList[entity.id].mask;
			const newMask = this.entityMaskList[entity.id].mask |= adiccionMask;

			/* const componentInsertionDelta = */ this.changeEntityMask(entity.id, oldMask, newMask);

			// for (const componentInfo of componentInsertionDelta.missingComponents) {
			// 	// TODO: pass the component ref to transform function
			// 	const startIndex = componentInsertionDelta.offset + componentInfo.offset;
			// 	new Uint8Array(componentInsertionDelta.view.buffer).fill(0, startIndex, startIndex + componentInfo.size);
			// }
		}
	}

	public removeComponentsInEntities = (entities: Entity[], componentsName: string[]): void => {
		let permissionMask = 0;
		for (const name of componentsName)
			permissionMask |= this.componentsMapView().get(name)!.mask;
		permissionMask = ~permissionMask;

		for (const entity of entities) {
			const oldMask = this.entityMaskList[entity.id].mask;
			if (oldMask === 0) continue;
			const newMask = this.entityMaskList[entity.id].mask &= permissionMask;

			this.changeEntityMask(entity.id, oldMask, newMask);
		}
	}

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

	private returnOrCreateGroup = (mask: number): Group => {
		let group = this.groupsMapView().get(mask) as Group;
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
			this.groupsMapView().set(mask, group);
		}
		return group;
	}

	private changeEntityMask = (entityId: number, oldMask: number, newMask: number): ComponentInsertionDelta => {
		let componentInsertionDelta = {} as ComponentInsertionDelta;

		if (oldMask === 0) {
			const newGroup = this.returnOrCreateGroup(newMask);
			componentInsertionDelta = {
				...newGroup.setSection(entityId),
				missingComponents: newGroup.getOrderedComponentInfo()
			};
		} else {
			const oldGroup = this.groupsMapView().get(oldMask) as Group,
				oldComponentDataView = new Uint8Array(oldGroup.getSectionData(entityId)),
				newGroup = this.returnOrCreateGroup(newMask);

			oldGroup.deleteSection(entityId);
			componentInsertionDelta = newGroup.setSectionData(
				entityId,
				oldGroup.getOrderedComponentInfo(),
				oldComponentDataView
			);
		}

		return componentInsertionDelta;
	}

	// components
	private readonly refsMapView: () => Map<string, Reference<EntComponent>>;
	private readonly componentsMapView: () => Map<string, ComponentMapProps>;
	private readonly componentSpecMap: Map<string, EntComponent>;
	private readonly componentList: ComponentListProps[];

	// entity data
	private readonly entityMaskList: { mask: number }[];
	private readonly recycledEntityIdList: number[];
	private nextEntityId: number;

	// groups
	private readonly emptyEntityIdList: number[];
	private readonly groupsMapView: () => Map<number, Group>;
}


export default EntManager;
