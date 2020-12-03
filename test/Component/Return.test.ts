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

	it('throw an error when return a component of a non-crated entity', () => {
		const registry = new Registry([Component]);

		expect(() => registry.getComponents<[Component]>(3, [Component]))
			.toThrowError('can not return a component of a non-crated entity 3');
	});

	it('return undefined when return a non-inserted component in entity', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		expect(registry.getComponents<[Component]>(entity, [Component]))
			.toStrictEqual([undefined]);
	});

	it('return the component reference', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const compRef = registry.insertComponent<Component>(entity, Component);

		compRef.Prop3 = -3000;
		compRef.prop_2 = 1.618;
		compRef.prop1 = 250;

		expect(registry.getComponents<[Component]>(entity, [Component])[0]).toStrictEqual(compRef);
	});

	it('use multiple distinct component references', () => {
		const registry = new Registry([Component]);
		const entity1 = registry.createEntity();
		const compRef1 = registry.insertComponent<Component>(entity1, Component);
		const entity2 = registry.createEntity();
		const compRef2 = registry.insertComponent<Component>(entity2, Component);
		const entity3 = registry.createEntity();
		const compRef3 = registry.insertComponent<Component>(entity3, Component);

		compRef1.Prop3 = -3000;
		compRef1.prop_2 = 1.618;
		compRef1.prop1 = 250;

		compRef2.Prop3 = -4000;
		compRef2.prop_2 = 0.319;
		compRef2.prop1 = 20;

		compRef3.Prop3 = -600;
		compRef3.prop_2 = 0.08323;
		compRef3.prop1 = 55;

		expect(registry.getComponents<[Component]>(entity1, [Component])[0]).toStrictEqual(compRef1);
		expect(registry.getComponents<[Component]>(entity2, [Component])[0]).toStrictEqual(compRef2);
		expect(registry.getComponents<[Component]>(entity3, [Component])[0]).toStrictEqual(compRef3);
	});

	it('entity have a inserted component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		registry.insertComponent<Component>(entity, Component);

		expect(registry.hasComponents(entity, [Component])).toStrictEqual([true]);
	});

	it('entity not have a component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		expect(registry.hasComponents(entity, [Component])).toStrictEqual([false]);
	});

	it('maps properties to return in component reference', () => {
		const registry = new Registry([FullPropertyComponent]);
		const entity = registry.createEntity();
		registry.insertComponent<FullPropertyComponent>(entity, FullPropertyComponent);

		expect(registry.getComponents<[FullPropertyComponent]>(entity, [FullPropertyComponent])[0].u_int_8).toBe(250);
		expect(registry.getComponents<[FullPropertyComponent]>(entity, [FullPropertyComponent])[0].u_int_16).toBe(65000);
		expect(registry.getComponents<[FullPropertyComponent]>(entity, [FullPropertyComponent])[0].u_int_32).toBe(4200000000);
		expect(registry.getComponents<[FullPropertyComponent]>(entity, [FullPropertyComponent])[0].u_int_64).toBe(BigInt(8446744073709551615));

		expect(registry.getComponents<[FullPropertyComponent]>(entity, [FullPropertyComponent])[0].int_8).toBe(-120);
		expect(registry.getComponents<[FullPropertyComponent]>(entity, [FullPropertyComponent])[0].int_16).toBe(-32000);
		expect(registry.getComponents<[FullPropertyComponent]>(entity, [FullPropertyComponent])[0].int_32).toBe(-2100000000);
		expect(registry.getComponents<[FullPropertyComponent]>(entity, [FullPropertyComponent])[0].int_64).toBe(BigInt(-844674407370955));

		expect(registry.getComponents<[FullPropertyComponent]>(entity, [FullPropertyComponent])[0].float_32).toBeGreaterThanOrEqual(3.141592653589793238);
		expect(registry.getComponents<[FullPropertyComponent]>(entity, [FullPropertyComponent])[0].float_64).toBeGreaterThanOrEqual(3.14159265358979323846264338327950288);
	});

});

describe('Component Buffer', () => {

	it('return a ArrayBuffer as component data', () => {
		const registry = new Registry([Component]);
		for (let i = 0; i < 10; i++) {
			const ent = registry.createEntity();
			registry.insertComponent(ent, Component);
		}
		const componentBuffer = registry.getComponentBuffer(Component);

		expect(registry.getPoolInfo(Component).allocatedSize).toBe(componentBuffer.byteLength);
	});

	it('create a iterable from the component schema and buffer', () => {
		const registry = new Registry([Component]);
		for (let i = 0; i < 5; i++) {
			const ent = registry.createEntity();
			registry.insertComponent(ent, Component);
		}
		registry.removeComponents(2, [Component]);

		const componentBuffer = registry.getComponentBuffer(Component);
		const componentIterator = Registry.getComponentIteratorFromBuffer<Component>(componentBuffer, Component);

		let componentCount = 0;
		for (const comp of componentIterator) {
			expect(comp).toStrictEqual({
				prop1: 1,
				prop_2: 3.1415,
				Prop3: 5000
			});
			componentCount++;
		}
		expect(componentCount).toBe(4);
	});

});
