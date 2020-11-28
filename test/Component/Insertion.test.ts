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


describe('Component insertion', () => {

	it('insert a component in a entity', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		registry.insertComponent<Component>(entity, Component);
		expect(registry.getPoolInfo(Component).usedSize)
			.toBe(registry.getComponentInfo(Component).size);
	});

	it('return the component reference when insert a new component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);

		componentRef.Prop3 = -4523;
		componentRef.prop_2 = 5.23234232;
		componentRef.prop1 = 120;

		expect(registry.getComponents<[Component]>(entity, [Component])[0]).toStrictEqual({
			prop1: 120,
			prop_2: 5.23234232,
			Prop3: -4523
		});
	});

	it('reset component values when insert in a already created component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);

		componentRef.Prop3 = -4523;
		componentRef.prop_2 = 5.23234232;
		componentRef.prop1 = 120;

		expect(registry.insertComponent<Component>(entity, Component)).toStrictEqual({
			prop1: 1,
			prop_2: 3.1415,
			Prop3: 5000
		});
	});

	it('throw an error when insert a component in a non-created entity', () => {
		const registry = new Registry([Component]);

		expect(() => registry.insertComponent<Component>(3, Component))
			.toThrowError('can not insert a component in a non-crated entity');
	});

	it('throw an error when insert a component in a deleted entity', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		registry.destroyEntity(entity);

		expect(() => registry.insertComponent<Component>(entity, Component))
			.toThrowError('can not insert a component in a non-crated entity');
	});

	it('maps the properties of the inserted component', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();

		const componentReference = registry.insertComponent<Component>(entity, Component);
		expect(componentReference).toStrictEqual({
			prop1: 1,
			prop_2: 3.1415,
			Prop3: 5000
		});
	});

	it('use free pool section of the previously excluded component', () => {
		const registry = new Registry([Component]);

		const entity1 = registry.createEntity();
		const entity2 = registry.createEntity();
		const entity3 = registry.createEntity();
		const entity4 = registry.createEntity();

		registry.insertComponent<Component>(entity1, Component);
		registry.insertComponent<Component>(entity2, Component);
		registry.insertComponent<Component>(entity3, Component);

		registry.removeComponents(entity2, [Component]);
		expect(registry.getPoolInfo(Component).usedSize).toBe(registry.getComponentInfo(Component).size * 2);

		registry.insertComponent<Component>(entity4, Component);
		expect(registry.getPoolInfo(Component).usedSize)
			.toBe(registry.getComponentInfo(Component).size * 3);
	});

});
