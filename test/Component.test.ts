import PropertyType from '../src/PropertyTypes';
import Storage, { ComponentSchema } from '../src/Storage';

interface ComponentData {
	property: number;
}

class Component implements ComponentData {
	public property: number = 2;

	public static schema: ComponentSchema = { property: PropertyType.BYTE };
}

describe('Component', () => {

	it('insert a component in a entity', () => {
		const storage = new Storage([Component]);
		const entity = storage.create();

		const component = storage.insert<Component>(entity, Component);
		expect(component).toStrictEqual(new Component);
	});

});