import PropertyType from '../src/PropertyTypes';
import Storage, { ComponentSchema, PoolSettings } from '../src/Storage';

const POOL_INCREASE_COUNT = 5;

interface ComponentData {
	property: number;
}

class Component implements ComponentData {
	public property: number = 2;

	public static schema: ComponentSchema = { property: PropertyType.BYTE };
	public static poolSettings: PoolSettings = { initialCount: 0, increaseCount: POOL_INCREASE_COUNT };
}

describe('Component', () => {

	it('insert a component in a entity', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		const component = storage.insert<Component>(entity, Component);
		expect(component).toStrictEqual({
			property: 2
		});
	});

	it('throw an error when insert a component in a non created entity', () => {
		const storage = new Storage([Component]);

		expect(() => storage.insert<Component>(3, Component)).toThrowError('can not insert a component in a non crated entity');
	});

	it('throw an error when insert a component in a deleted entity', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();
		storage.destroy(entity);

		expect(() => storage.insert<Component>(entity, Component)).toThrowError('can not insert a component in a non crated entity');
	});

});
