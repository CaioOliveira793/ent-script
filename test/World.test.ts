import World from '../src/World';
import PropertyType from '../src/PropType';
import { EntScript, EntUniqueComponent } from '../src/EntTypes';


class ComponentOne extends EntUniqueComponent {
	public static schema = { prop1: PropertyType.INT_32 }
	public static default = { prop1: 1 }

	public prop1 = 1;
}

class ComponentTwo extends EntUniqueComponent {
	public static schema = { prop2: PropertyType.INT_32 }
	public static default = { prop2: 2 }

	public prop2 = 2;
}

class ComponentThree extends EntUniqueComponent {
	public static schema = { prop3: PropertyType.INT_32 }
	public static default = { prop3: 3 }

	public prop3 = 3;
}


describe('World', () => {

	it('create a new World with a list of components', () => {
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);

		expect(world).toBeInstanceOf(World);
	});

	it('run all scheduled scripts', () => {
		let remainingEntitiesToRun = 284;
		class TestScript extends EntScript {
			public forEachEntity = (one: ComponentOne, two: ComponentTwo): void => {
				expect(one).toStrictEqual({ prop1: 0 });
				expect(two).toStrictEqual({ prop2: 0 });
				remainingEntitiesToRun--;
			}

			public argsType = ['ComponentOne', 'ComponentTwo'];
		}

		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);
		world.addScript(TestScript);
		world.schedule([TestScript.name]);
		world.EntManager.createEntitiesWithComponents(['ComponentOne', 'ComponentTwo'], remainingEntitiesToRun);
		world.EntManager.createEntitiesWithComponents(['ComponentOne', 'ComponentThree'], 72);
		world.EntManager.createEntitiesWithComponents(['ComponentTwo'], 54);

		world.execute();
		expect(remainingEntitiesToRun).toBe(0);
	});

});
