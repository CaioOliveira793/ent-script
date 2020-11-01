import PropertyType from '../src/PropertyTypes';
import Storage, { ComponentSchema, PoolSettings } from '../src/Storage';

const POOL_INCREASE_COUNT = 5;

class Component {
	public prop1: number = 1;
	public prop_2: number = 3.1415;
	public Prop3: number = 5000;

	public static poolSettings: PoolSettings = { initialCount: 0, increaseCount: POOL_INCREASE_COUNT };
	public static schema: ComponentSchema = {
		prop1: PropertyType.BYTE,
		prop_2: PropertyType.DOUBLE,
		Prop3: PropertyType.INT_32,
	};
}

describe('Component', () => {

	it('insert a component in a entity', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		storage.insert<Component>(entity, Component);
		expect(storage.getPoolInfo(Component).usedSize).toBe(storage.getComponentInfo(Component).size);
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

	it('maps the properties of the inserted component', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		const componentReference = storage.insert<Component>(entity, Component);
		expect(componentReference).toStrictEqual({
			prop1: 1,
			prop_2: 3.1415,
			Prop3: 5000
		});
	});

});
