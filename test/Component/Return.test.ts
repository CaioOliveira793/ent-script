import Registry, { ComponentSchema, PoolSettings, PropertyType } from '../../src/index';

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

	public static poolSettings: PoolSettings = {
		initialCount: 0,
		increaseCount: POOL_INCREASE_COUNT
	};
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

describe('Component return', () => {

	it('throw an error when retrieve a component of a non-crated entity', () => {
		const registry = new Registry([Component]);

		expect(() => registry.getComponent<Component>(3, Component))
			.toThrowError('can not retrieve a component of a non-crated entity');
	});

	it('throw an error when retrieve a non-inserted component in entity', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		expect(() => registry.getComponent<Component>(entity, Component))
			.toThrowError(`entity does not have component ${Component.name} to retrieve`);
	});

	it('retrieve the component reference', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const compRef = registry.insertComponent<Component>(entity, Component);

		compRef.Prop3 = -3000;
		compRef.prop_2 = 1.618;
		compRef.prop1 = 250;

		expect(registry.getComponent<Component>(entity, Component)).toStrictEqual(compRef);
	});

	it('entity have a inserted component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		registry.insertComponent<Component>(entity, Component);

		expect(registry.hasComponent<Component>(entity, Component)).toBe(true);
	});

	it('entity not have a component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		expect(registry.hasComponent<Component>(entity, Component)).toBe(false);
	});

	it('maps properties to return in component reference', () => {
		const registry = new Registry([FullPropertyComponent]);
		const entity = registry.createEntity();
		registry.insertComponent<FullPropertyComponent>(entity, FullPropertyComponent);

		expect(registry.getComponent<FullPropertyComponent>(entity, FullPropertyComponent).u_int_8).toBe(250);
		expect(registry.getComponent<FullPropertyComponent>(entity, FullPropertyComponent).u_int_16).toBe(65000);
		expect(registry.getComponent<FullPropertyComponent>(entity, FullPropertyComponent).u_int_32).toBe(4200000000);
		expect(registry.getComponent<FullPropertyComponent>(entity, FullPropertyComponent).u_int_64).toBe(BigInt(8446744073709551615));

		expect(registry.getComponent<FullPropertyComponent>(entity, FullPropertyComponent).int_8).toBe(-120);
		expect(registry.getComponent<FullPropertyComponent>(entity, FullPropertyComponent).int_16).toBe(-32000);
		expect(registry.getComponent<FullPropertyComponent>(entity, FullPropertyComponent).int_32).toBe(-2100000000);
		expect(registry.getComponent<FullPropertyComponent>(entity, FullPropertyComponent).int_64).toBe(BigInt(-844674407370955));

		expect(registry.getComponent<FullPropertyComponent>(entity, FullPropertyComponent).float_32).toBeGreaterThanOrEqual(3.141592653589793238);
		expect(registry.getComponent<FullPropertyComponent>(entity, FullPropertyComponent).float_64).toBeGreaterThanOrEqual(3.14159265358979323846264338327950288);
	});

});