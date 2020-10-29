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

	it('destroy a not created entity', () => {
		const storage = new Storage([Component]);

		expect(storage.destroy(3)).toBe(false);
	});

});
