import PropertyType from '../src/PropertyTypes';
import Registry, { ComponentSchema } from '../src/Registry';


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
		expect(registry.getPoolInfo(Component).freeSections.length).toBe(1);
	});

	it('verify if a entity exists', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		expect(registry.isExistentEntity(entity)).toBe(true);
	});

});
