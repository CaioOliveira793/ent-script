import World from '../src/World';
import PropertyType from '../src/PropertyTypes';
import { ComponentSchema, EntComponent } from '../src/EntTypes';


class ComponentOne extends EntComponent {
	public prop: number = 111;

	public static schema: ComponentSchema = { prop: PropertyType.INT_32 };
}

class ComponentTwo extends EntComponent {
	public prop: number = 222;

	public static schema: ComponentSchema = { prop: PropertyType.INT_32 };
}

class ComponentThree extends EntComponent {
	public prop: number = 333;

	public static schema: ComponentSchema = { prop: PropertyType.INT_32 };
}


describe('EntManager', () => {

	it('create entities', () => {
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);

		const entityList = world.EntManager.createEntities(4);
		expect(entityList).toStrictEqual([
			{ id: 0, mask: 0, },
			{ id: 1, mask: 0, },
			{ id: 2, mask: 0, },
			{ id: 3, mask: 0, }
		]);
	});

	it('create entities with components', () => {
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);
		const entityList = world.EntManager.createEntitiesWithComponents(['ComponentOne', 'ComponentThree'], 4);

		expect(entityList).toStrictEqual([
			{ id: 0, mask: 0b00000101, },
			{ id: 1, mask: 0b00000101, },
			{ id: 2, mask: 0b00000101, },
			{ id: 3, mask: 0b00000101, }
		]);
		for (const entity of entityList) {
			expect(world.EntManager.hasComponents(entity, ['ComponentOne', 'ComponentTwo', 'ComponentThree']))
				.toStrictEqual([true, false, true]);
		}
	});


	it('destroy a list of entities', () => {
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);
		const entityList = world.EntManager.createEntitiesWithComponents(['ComponentOne', 'ComponentThree'], 13);

		world.EntManager.destroyEntities(entityList);
		for (const entity of entityList) {
			expect(world.EntManager.isExistentEntity(entity)).toBe(false);
		}
	});


	it('verify entity existence', () => {
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);
		const entityList = world.EntManager.createEntities();
		expect(world.EntManager.isExistentEntity(entityList[0])).toBe(true);
		world.EntManager.destroyEntities(entityList);
		expect(world.EntManager.isExistentEntity(entityList[0])).toBe(false);
	});

	it('verify valid entity', () => {
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);

		const entityList = world.EntManager.createEntities();
		expect(world.EntManager.isValidEntity(entityList[0])).toBe(true);

		world.EntManager.addComponentsInEntities(entityList, ['ComponentOne', 'ComponentThree']);
		expect(world.EntManager.isValidEntity(entityList[0])).toBe(false);

		world.EntManager.destroyEntities(entityList);
		expect(world.EntManager.isExistentEntity(entityList[0])).toBe(false);
	});

	it('verify if entity has component', () => {
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);
		const entityList = world.EntManager.createEntitiesWithComponents(['ComponentOne', 'ComponentThree'], 4);

		world.EntManager.addComponentsInEntities(entityList.slice(1, 3), ['ComponentTwo']);
		world.EntManager.removeComponentsInEntities(entityList.slice(1, 3), ['ComponentOne']);

		expect(world.EntManager.hasComponents(entityList[0], ['ComponentOne', 'ComponentTwo', 'ComponentThree']))
			.toStrictEqual([true, false, true]);
		expect(world.EntManager.hasComponents(entityList[1], ['ComponentOne', 'ComponentTwo', 'ComponentThree']))
			.toStrictEqual([false, true, true]);
		expect(world.EntManager.hasComponents(entityList[2], ['ComponentOne', 'ComponentTwo', 'ComponentThree']))
			.toStrictEqual([false, true, true]);
		expect(world.EntManager.hasComponents(entityList[3], ['ComponentOne', 'ComponentTwo', 'ComponentThree']))
			.toStrictEqual([true, false, true]);
	});

	it('return the component count of a entity', () => {
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);
		const entityList = world.EntManager.createEntitiesWithComponents(['ComponentOne']);
		expect(world.EntManager.getComponentCount(entityList[0])).toBe(1);

		world.EntManager.addComponentsInEntities(entityList, ['ComponentTwo']);
		expect(world.EntManager.getComponentCount(entityList[0])).toBe(2);

		world.EntManager.removeComponentsInEntities(entityList, ['ComponentOne']);
		expect(world.EntManager.getComponentCount(entityList[0])).toBe(1);

		world.EntManager.addComponentsInEntities(entityList, ['ComponentTwo']);
		expect(world.EntManager.getComponentCount(entityList[0])).toBe(1);

		world.EntManager.addComponentsInEntities(entityList, [ComponentOne.name, ComponentThree.name]);
		expect(world.EntManager.getComponentCount(entityList[0])).toBe(3);
	});

});
