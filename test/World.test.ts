import World from '../src/World';
import PropertyType from '../src/PropType';
import { EntComponentSpec, ComponentType, EntScript } from '../src/EntTypes';


const componentOneSpec: EntComponentSpec = {
	name: 'ComponentOne',
	schema: { prop1: PropertyType.INT_32 },
	type: ComponentType.UNIQUE
}

interface ComponentOne { prop1: number; }

const componentTwoSpec: EntComponentSpec = {
	name: 'ComponentTwo',
	schema: { prop2: PropertyType.INT_32 },
	type: ComponentType.UNIQUE
}

interface ComponentTwo { prop2: number; }

const componentThreeSpec: EntComponentSpec = {
	name: 'ComponentThree',
	schema: { prop3: PropertyType.INT_32 },
	type: ComponentType.UNIQUE
}



describe('World', () => {

	it('create a new World with a list of components', () => {
		const world = new World([componentOneSpec, componentTwoSpec, componentThreeSpec]);

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

		const world = new World([componentOneSpec, componentTwoSpec, componentThreeSpec]);
		world.addScript(TestScript);
		world.schedule([TestScript.name]);
		world.EntManager.createEntitiesWithComponents(['ComponentOne', 'ComponentTwo'], remainingEntitiesToRun);
		world.EntManager.createEntitiesWithComponents(['ComponentOne', 'ComponentThree'], 72);
		world.EntManager.createEntitiesWithComponents(['ComponentTwo'], 54);

		world.execute();
		expect(remainingEntitiesToRun).toBe(0);
	});

});
