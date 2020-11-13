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

describe('Component deletion', () => {

	it('delete an existing component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		registry.insertComponent<Component>(entity, Component);

		expect(registry.removeComponent(entity, Component)).toBe(true);
		expect(registry.getPoolInfo(Component).freeSections.length).toBe(1);
	});

	it('delete a non-existent component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		expect(registry.removeComponent(entity, Component)).toBe(false);
		expect(registry.getPoolInfo(Component).freeSections.length).toBe(0);
	});

	it('throw an error when delete a component in a non-existent entity', () => {
		const registry = new Registry([Component]);

		expect(() => registry.removeComponent(3, Component))
			.toThrowError('can not delete a component of a non-crated entity');
	});


	it('clear one type of compoenent', () => {
		const registry = new Registry([Component, FullPropertyComponent]);
		const entity1 = registry.createEntity();
		registry.insertComponent<Component>(entity1, Component);
		registry.insertComponent<FullPropertyComponent>(entity1, FullPropertyComponent);

		const entity2 = registry.createEntity();
		registry.insertComponent<Component>(entity2, Component);
		registry.insertComponent<FullPropertyComponent>(entity2, FullPropertyComponent);

		registry.clearComponents(FullPropertyComponent);

		expect(registry.getPoolInfo(FullPropertyComponent).usedSize).toBe(0);
		expect(registry.hasComponent(entity1, Component)).toBe(true);
		expect(registry.hasComponent(entity2, Component)).toBe(true);
	});


	it('clear all components', () => {
		const registry = new Registry([Component, FullPropertyComponent]);
		const entity1 = registry.createEntity();
		registry.insertComponent<Component>(entity1, Component);
		registry.insertComponent<FullPropertyComponent>(entity1, FullPropertyComponent);

		const entity2 = registry.createEntity();
		registry.insertComponent<Component>(entity2, Component);
		registry.insertComponent<FullPropertyComponent>(entity2, FullPropertyComponent);

		registry.clearAllComponents();

		expect(registry.getPoolInfo(Component).usedSize).toBe(0);
		expect(registry.getPoolInfo(FullPropertyComponent).usedSize).toBe(0);
	});

	it('return the number of deleted components', () => {
		const registry = new Registry([Component, FullPropertyComponent]);
		const entity1 = registry.createEntity();
		registry.insertComponent<Component>(entity1, Component);
		registry.insertComponent<FullPropertyComponent>(entity1, FullPropertyComponent);

		const entity2 = registry.createEntity();
		registry.insertComponent<FullPropertyComponent>(entity2, FullPropertyComponent);

		expect(registry.clearAllComponents()).toBe(3);
	});

	it('entities not have deleted components', () => {
		const registry = new Registry([Component, FullPropertyComponent]);
		const entity1 = registry.createEntity();
		registry.insertComponent<Component>(entity1, Component);
		registry.insertComponent<FullPropertyComponent>(entity1, FullPropertyComponent);

		const entity2 = registry.createEntity();
		registry.insertComponent<FullPropertyComponent>(entity2, FullPropertyComponent);
		registry.insertComponent<FullPropertyComponent>(entity2, FullPropertyComponent);

		registry.clearAllComponents();

		expect(registry.hasComponent<Component>(entity1, Component)).toBe(false);
		expect(registry.hasComponent<FullPropertyComponent>(entity1, FullPropertyComponent)).toBe(false);
		expect(registry.hasComponent<Component>(entity1, Component)).toBe(false);
		expect(registry.hasComponent<FullPropertyComponent>(entity1, FullPropertyComponent)).toBe(false);
	});

});