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

class FullPropertyComponent {
	public u_int_8: number = 250;
	public u_int_16: number = 65000;
	public u_int_32: number = 4200000000;
	public u_int_64: bigint = BigInt(8446744073709551615);

	public int_8: number = -120;
	public int_16: number = -32000;
	public int_32: number = -2100000000;
	public int_64: bigint = BigInt(-844674407370955);

	public float_32: number = 3.141592653589793238;
	public float_64: number = 3.14159265358979323846264338327950288;

	public static poolSettings: PoolSettings = { initialCount: 0, increaseCount: POOL_INCREASE_COUNT };
	public static schema: ComponentSchema = {
		u_int_8: PropertyType.U_INT_8,
		u_int_16: PropertyType.U_INT_16,
		u_int_32: PropertyType.U_INT_32,
		u_int_64: PropertyType.U_INT_64,

		int_8: PropertyType.INT_8,
		int_16: PropertyType.INT_16,
		int_32: PropertyType.INT_32,
		int_64: PropertyType.INT_64,

		float_32: PropertyType.FLOAT_32,
		float_64: PropertyType.FLOAT_64,
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

	it('use free pool section of the previously excluded component', () => {
		const storage = new Storage([Component]);

		const entity1 = storage.create();
		const entity2 = storage.create();
		const entity3 = storage.create();
		const entity4 = storage.create();

		storage.insert<Component>(entity1, Component);
		storage.insert<Component>(entity2, Component);
		storage.insert<Component>(entity3, Component);

		storage.remove<Component>(entity2, Component);
		expect(storage.getPoolInfo(Component).freeSections.length).toBe(1);

		storage.insert<Component>(entity4, Component);
		expect(storage.getPoolInfo(Component).freeSections.length).toBe(0);
		expect(storage.getPoolInfo(Component).usedSize).toBe(storage.getComponentInfo(Component).size * 3);
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

	it('maps properties to return in component reference', () => {
		const storage = new Storage([FullPropertyComponent]);
		const entity = storage.create();
		storage.insert<FullPropertyComponent>(entity, FullPropertyComponent);

		expect(storage.retrieve<FullPropertyComponent>(entity, FullPropertyComponent).u_int_8).toBe(250);
		expect(storage.retrieve<FullPropertyComponent>(entity, FullPropertyComponent).u_int_16).toBe(65000);
		expect(storage.retrieve<FullPropertyComponent>(entity, FullPropertyComponent).u_int_32).toBe(4200000000);
		expect(storage.retrieve<FullPropertyComponent>(entity, FullPropertyComponent).u_int_64).toBe(BigInt(8446744073709551615));

		expect(storage.retrieve<FullPropertyComponent>(entity, FullPropertyComponent).int_8).toBe(-120);
		expect(storage.retrieve<FullPropertyComponent>(entity, FullPropertyComponent).int_16).toBe(-32000);
		expect(storage.retrieve<FullPropertyComponent>(entity, FullPropertyComponent).int_32).toBe(-2100000000);
		expect(storage.retrieve<FullPropertyComponent>(entity, FullPropertyComponent).int_64).toBe(BigInt(-844674407370955));

		expect(storage.retrieve<FullPropertyComponent>(entity, FullPropertyComponent).float_32).toBeGreaterThanOrEqual(3.141592653589793238);
		expect(storage.retrieve<FullPropertyComponent>(entity, FullPropertyComponent).float_64).toBeGreaterThanOrEqual(3.14159265358979323846264338327950288);
	});

});

describe('Component deletion', () => {

	it('delete an existing component', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();
		storage.insert<Component>(entity, Component);

		expect(storage.remove(entity, Component)).toBe(true);
		expect(storage.getPoolInfo(Component).freeSections.length).toBe(1);
	});

	it('delete a non-existent component', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		expect(storage.remove(entity, Component)).toBe(false);
		expect(storage.getPoolInfo(Component).freeSections.length).toBe(0);
	});

	it('throw an error when delete a component in a non-existent entity', () => {
		const storage = new Storage([Component]);

		expect(() => storage.remove(3, Component))
			.toThrowError('can not delete a component of a non-crated entity');
	});

});
