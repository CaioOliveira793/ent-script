import PropertyType from '../src/PropertyTypes';
import Storage, { ComponentSchema, PoolSettings } from '../src/Storage';

const POOL_INCREASE_COUNT = 2;

class Component {
	public prop1: number = 1;
	public prop_2: number = 3.1415;
	public Prop3: number = 5000;

	public static poolSettings: PoolSettings = { initialCount: 2, increaseCount: POOL_INCREASE_COUNT };
	public static schema: ComponentSchema = {
		prop1: PropertyType.BYTE,
		prop_2: PropertyType.DOUBLE,
		Prop3: PropertyType.INT_32,
	};
}


describe('Component insertion', () => {

	it('insert a component in a entity', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		storage.insert<Component>(entity, Component);
		expect(storage.getPoolInfo(Component).usedSize).toBe(storage.getComponentInfo(Component).size);
	});

	it('return the component reference when insert a new component', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();
		const componentRef = storage.insert<Component>(entity, Component);

		componentRef.Prop3 = -4523;
		componentRef.prop_2 = 5.23234232;
		componentRef.prop1 = 120;

		expect(storage.retrieve<Component>(entity, Component)).toStrictEqual({
			prop1: 120,
			prop_2: 5.23234232,
			Prop3: -4523
		});
	});

	it('reset component values when insert in a already created component', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();
		const componentRef = storage.insert<Component>(entity, Component);

		componentRef.Prop3 = -4523;
		componentRef.prop_2 = 5.23234232;
		componentRef.prop1 = 120;

		expect(storage.insert<Component>(entity, Component)).toStrictEqual({
			prop1: 1,
			prop_2: 3.1415,
			Prop3: 5000
		});
	});

	it('throw an error when insert a component in a non-created entity', () => {
		const storage = new Storage([Component]);

		expect(() => storage.insert<Component>(3, Component))
			.toThrowError('can not insert a component in a non-crated entity');
	});

	it('throw an error when insert a component in a deleted entity', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();
		storage.destroy(entity);

		expect(() => storage.insert<Component>(entity, Component))
			.toThrowError('can not insert a component in a non-crated entity');
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

	it('increase buffer size when insert new components', () => {
		const storage = new Storage([Component]);

		for (let i = 0; i < POOL_INCREASE_COUNT + 1; i++) {
			const entity = storage.create();
			storage.insert<Component>(entity, Component);
		}

		expect(storage.getPoolInfo(Component).usedSize)
			.toBeGreaterThanOrEqual(storage.getComponentInfo(Component).size * (POOL_INCREASE_COUNT + 1));
	});

});

describe('Component return', () => {

	it('throw an error when retrieve a component of a non-crated entity', () => {
		const storage = new Storage([Component]);

		expect(() => storage.retrieve<Component>(3, Component))
			.toThrowError('can not retrieve a component of a non-crated entity');
	});

	it('throw an error when retrieve a non-inserted component in entity', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		expect(() => storage.retrieve<Component>(entity, Component))
			.toThrowError(`entity does not have component ${Component.name} to retrieve`);
	});

	it('retrieve the component reference', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();
		const compRef = storage.insert<Component>(entity, Component);

		compRef.Prop3 = -3000;
		compRef.prop_2 = 1.618;
		compRef.prop1 = 250;

		expect(storage.retrieve<Component>(entity, Component)).toStrictEqual(compRef);
	});

});

describe('Component deletion', () => {

	it('delete an existing component', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();
		storage.insert<Component>(entity, Component);

		storage.remove(entity, Component);

		expect(storage.getPoolInfo(Component).freeSections.length).toBe(1);
	});

	it('delete a non-existent component', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();
		storage.remove(entity, Component);

		expect(storage.getPoolInfo(Component).freeSections.length).toBe(0);
	});

	it('throw an error when delete a component in a non-existent entity', () => {
		const storage = new Storage([Component]);

		expect(() => storage.remove(3, Component))
			.toThrowError('can not delete a component of a non-crated entity');
	});

});
