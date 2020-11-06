import PropertyType from '../src/PropertyTypes';
import Registry, { ComponentSchema } from '../src/Registry';


class Component {
	static schema: ComponentSchema = { property: PropertyType.BYTE };
}

describe('Entity', () => {

	it('create a new entity', () => {
		const registry = new Registry([Component]);

		expect(registry.create()).toBe(0);
	});

	it('destroy a entity', () => {
		const registry = new Registry([Component]);
		const entity = registry.create();

		expect(registry.destroy(entity)).toBe(true);
	});

	it('destroy a non-created entity', () => {
		const registry = new Registry([Component]);

		expect(registry.destroy(3)).toBe(false);
	});

	it('destroy a entity and its components', () => {
		const registry = new Registry([Component]);
		const entity = registry.create();

		registry.insert<Component>(entity, Component);

		expect(registry.destroy(entity)).toBe(true);
		expect(registry.getPoolInfo(Component).freeSections.length).toBe(1);
	});

	it('verify if a entity exists', () => {
		const registry = new Registry([Component]);
		const entity = registry.create();

		expect(registry.isExistentEntity(entity)).toBe(true);
	});

});
