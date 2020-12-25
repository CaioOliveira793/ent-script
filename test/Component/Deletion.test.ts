import Registry, { ComponentSchema, PoolSettings, PropType } from '../../src/index';

const POOL_INCREASE_COUNT = 2;

class Component {
	public prop1: number = 1;
	public prop_2: number = 3.1415;
	public Prop3: number = 5000;

	public static poolSettings: PoolSettings = { initialCount: 2, increaseCount: POOL_INCREASE_COUNT };
	public static schema: ComponentSchema = {
		prop1: PropType.BYTE,
		prop_2: PropType.DOUBLE,
		Prop3: PropType.INT_32,
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
		u_int_8: PropType.U_INT_8,
		u_int_16: PropType.U_INT_16,
		u_int_32: PropType.U_INT_32,
		u_int_64: PropType.U_INT_64,

		int_8: PropType.INT_8,
		int_16: PropType.INT_16,
		int_32: PropType.INT_32,
		int_64: PropType.INT_64,

		float_32: PropType.FLOAT_32,
		float_64: PropType.FLOAT_64,
	};
}

describe('Component deletion', () => {

	it('delete an existing component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		registry.insertComponent<Component>(entity, Component);

		expect(registry.removeComponents(entity, [Component])).toStrictEqual([true]);
		expect(registry.getPoolInfo(Component).usedSize).toBe(0);
	});

	it('delete a non-existent component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		expect(registry.removeComponents(entity, [Component])).toStrictEqual([false]);
		expect(registry.getPoolInfo(Component).usedSize).toBe(0);
	});

	it('throw an error when remove a component in a non-existent entity', () => {
		const registry = new Registry([Component]);

		expect(() => registry.removeComponents(3, [Component]))
			.toThrowError('can not remove a component of a non-crated entity 3');
	});


	it('clear one type of compoenent', () => {
		const registry = new Registry([Component, FullPropertyComponent]);
		const entity1 = registry.createEntity();
		registry.insertComponent<Component>(entity1, Component);
		registry.insertComponent<FullPropertyComponent>(entity1, FullPropertyComponent);

		const entity2 = registry.createEntity();
		registry.insertComponent<Component>(entity2, Component);
		registry.insertComponent<FullPropertyComponent>(entity2, FullPropertyComponent);

		registry.clearComponents([FullPropertyComponent]);

		expect(registry.getPoolInfo(FullPropertyComponent).usedSize).toBe(0);
		expect(registry.hasComponents(entity1, [Component])).toStrictEqual([true]);
		expect(registry.hasComponents(entity2, [Component])).toStrictEqual([true]);
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

		expect(registry.hasComponents(entity1, [Component, FullPropertyComponent])).toStrictEqual([false, false]);
		expect(registry.hasComponents(entity2, [Component, FullPropertyComponent])).toStrictEqual([false, false]);
	});

});