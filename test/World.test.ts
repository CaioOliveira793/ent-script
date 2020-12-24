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


describe('World', () => {

	it('create a new World with a list of components', () => {
		const world = new World([ComponentOne, ComponentTwo, ComponentThree]);

		expect(world).toBeInstanceOf(World);
	});

});
