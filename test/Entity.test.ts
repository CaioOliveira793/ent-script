import Registry, { ComponentSchema, PropertyType } from '../src/index';


class Component {
	static schema: ComponentSchema = { property: PropertyType.BYTE };
}

describe('Entity', () => {

	it('create a new entity', () => {
		const registry = new Registry([Component]);

		expect(registry.createEntity()).toBe(0);
	});

	it('destroy a entity', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		expect(registry.destroyEntity(entity)).toBe(true);
	});

	it('destroy a non-created entity', () => {
		const registry = new Registry([Component]);

		expect(registry.destroyEntity(3)).toBe(false);
	});

	it('destroy a entity and its components', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		registry.insertComponent<Component>(entity, Component);

		expect(registry.destroyEntity(entity)).toBe(true);
		expect(registry.getPoolInfo(Component).usedSize).toBe(0);
	});

	it('verify if a entity exists', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		expect(registry.isExistentEntity(entity)).toBe(true);
	});

	it('return component count of a entity', () => {
		const registry = new Registry([Component]);
		const entity1 = registry.createEntity();
		registry.insertComponent(entity1, Component);

		const entity2 = registry.createEntity();
		registry.insertComponent(entity2, Component);
		registry.removeComponents(entity2, [Component]);

		expect(registry.getEntityComponentCount(entity1)).toBe(1);
		expect(registry.getEntityComponentCount(entity2)).toBe(0);
	});

	it('throw an error when return component count of a non-created entity', () => {
		const registry = new Registry([Component]);

		expect(() => registry.getEntityComponentCount(3))
			.toThrowError('can not return component count of a non-crated entity');
	});

});


describe('Entity queries', () => {
	class Component1 {
		static schema: ComponentSchema = { property: PropertyType.BYTE };
	}
	class Component2 {
		static schema: ComponentSchema = { property: PropertyType.BYTE };
	}

	it('return a iterator of entities that has two components', () => {
		const registry = new Registry([Component1, Component2]);
		registry.createEntity();
		registry.createEntity();

		for (let i = 0; i < 10; i++) {
			const ent = registry.createEntity();
			registry.insertComponent(ent, Component1);
			registry.insertComponent(ent, Component2);
		}

		for (let i = 0; i < 13; i++) {
			const ent = registry.createEntity();
			registry.insertComponent(ent, Component1);
		}

		for (let i = 0; i < 5; i++) {
			const ent = registry.createEntity();
			registry.insertComponent(ent, Component2);
		}

		const entityIterator = registry.getEntitiesIteratorWith([Component1, Component2]);

		const entityList = [];
		for (const entity of entityIterator) {
			entityList.push(entity);
		}

		expect(entityList).toStrictEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
	});

	it('throw an error when return a iterator of entities that has no components', () => {
		const registry = new Registry([Component1, Component2]);

		for (let i = 0; i < 5; i++) {
			const ent = registry.createEntity();
			registry.insertComponent(ent, Component1);
			registry.insertComponent(ent, Component2);
		}

		expect(() => registry.getEntitiesIteratorWith([]).next())
			.toThrow('the entity iterator need at least one component');
	});

});
