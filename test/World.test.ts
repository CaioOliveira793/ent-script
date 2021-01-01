import World from '../src/World';
import PropertyType from '../src/PropType';
import { ComponentSchema, EntComponent, EntScript } from '../src/EntTypes';


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




describe('World', () => {

	it('create a new World with a list of components', () => {
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);

		expect(world).toBeInstanceOf(World);
	});

	it('run all scheduled scripts', () => {
		let counter = 0;
		class TestScript extends EntScript {
			public forEachEntity = (one: ComponentOne, two: ComponentTwo): void => {
				expect(one.prop).toBe(111);
				expect(two.prop).toBe(222);
				counter++;
			}

			public argsType = [ComponentOne.name, ComponentTwo.name];
		}
		
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);
		world.addScript(TestScript);
		world.schedule([TestScript.name]);
		world.EntManager.createEntitiesWithComponents([ComponentOne.name, ComponentTwo.name], 3);

		world.execute();
		expect(counter).toBe(3);
	});

});
