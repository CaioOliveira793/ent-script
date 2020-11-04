import PropertyType from '../src/PropertyTypes';
import Storage, { ComponentSchema } from '../src/Storage';


class Component {
	static schema: ComponentSchema = { property: PropertyType.BYTE };
}

describe('Entity', () => {

	it('create a new entity', () => {
		const storage = new Storage([Component]);

		expect(storage.create()).toBe(0);
	});

	it('destroy a entity', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		expect(storage.destroy(entity)).toBe(true);
	});

	it('destroy a non-created entity', () => {
		const storage = new Storage([Component]);

		expect(storage.destroy(3)).toBe(false);
	});

	it('destroy a entity and its components', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		storage.insert<Component>(entity, Component);

		expect(storage.destroy(entity)).toBe(true);
		expect(storage.getPoolInfo(Component).freeSections.length).toBe(1);
	});

	it('verify if a entity exists', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		expect(storage.isExistentEntity(entity)).toBe(true);
	});

});
