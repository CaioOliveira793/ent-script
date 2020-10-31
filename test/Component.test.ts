import PropertyType from '../src/PropertyTypes';
import Storage, { ComponentSchema, PoolSettings } from '../src/Storage';

interface ComponentData {
	property: number;
}

class Component implements ComponentData {
	public property: number = 2;

	public static schema: ComponentSchema = { property: PropertyType.BYTE };
	public static poolSettings: PoolSettings = { initialCount: 0, increaseCount: 10 };
}

describe('Component', () => {

	it('insert a component in a entity', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		const component = storage.insert<Component>(entity, Component);
		console.log(component);
		expect(component).toStrictEqual({
			property: 2
		});
	});

});
