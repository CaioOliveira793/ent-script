import Storage, { ComponentConstructor, MAX_COMPONENTS } from '../src/Storage';
import PropertyType from '../src/PropertyTypes';


describe('Storage construction', () => {

	it('throw an error when no component is passed', () => {
		expect(() => new Storage([])).toThrowError('no component was supplied in the Storage constructor');
	});

	it('throw an error when exceed the max number of components', () => {
		class Component {
			static schema = { property: PropertyType.INT_32 };
		}

		const componentsList: ComponentConstructor[] = [];
		for (let i = 0; i < MAX_COMPONENTS + 1; i++) {
			componentsList.push(Component);
		}

		expect(() => new Storage(componentsList)).toThrowError('max number of 32 components was exceeded');
	});

	it('create a pool with the component', () => {
		class Component {
			static schema = { property: PropertyType.BYTE };
		}

		const storage = new Storage([Component]);

		const expectedComponentInfo = {
			name: 'Component',
			size: 8,
			properties: [{
				name: 'property',
				size: 8,
				offset: 0
			}]
		};

		expect(storage.getComponentInfo(Component)).toStrictEqual(expectedComponentInfo);
	});

});
