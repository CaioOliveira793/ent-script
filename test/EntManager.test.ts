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
		const entityList = world.EntManager.createEntitiesWithComponents({
			'ComponentOne': [],
			'ComponentThree': []
		}, 4);

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
		const entityList = world.EntManager.createEntitiesWithComponents({
			'ComponentOne': [],
			'ComponentThree': []
		}, 13);

		world.EntManager.destroyEntities(entityList);
		for (const entity of entityList) {
			expect(world.EntManager.isExistentEntity(entity)).toBe(false);
		}
	});

});
