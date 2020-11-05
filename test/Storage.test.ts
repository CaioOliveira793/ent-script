import Storage, {
	ComponentConstructor, ComponentInfo, ComponentSchema, MAX_COMPONENTS,
	PoolInfo, PoolSettings
} from '../src/Storage';
import PropertyType from '../src/PropertyTypes';


describe('Storage construction', () => {

	it('throw an error when no component is passed', () => {
		expect(() => new Storage([])).toThrowError('no component was supplied in the Storage constructor');
	});

	it('throw an error when exceed the max number of components', () => {
		class Component {
			static schema: ComponentSchema = { property: PropertyType.INT_32 };
		}

		const componentsList: ComponentConstructor<Component>[] = [];
		for (let i = 0; i < MAX_COMPONENTS + 1; i++) {
			componentsList.push(Component);
		}

		expect(() => new Storage(componentsList)).toThrowError('max number of 32 components was exceeded');
	});

	it('create a pool with the component', () => {
		class Component {
			static schema: ComponentSchema = { property: PropertyType.BYTE };
		}

		const storage = new Storage([Component]);

		const expectedComponentInfo: ComponentInfo = {
			name: 'Component',
			size: 1,
			properties: [{
				name: 'property',
				type: PropertyType.BYTE,
				size: 1,
				offset: 0
			}]
		};

		expect(storage.getComponentInfo(Component)).toStrictEqual(expectedComponentInfo);
	});

	it('create a pool with the specified settings', () => {
		class Component {
			static schema: ComponentSchema = { property: PropertyType.FLOAT_32 };
			static poolSettings: PoolSettings = {
				initialCount: 14,
				increaseCount: 20
			};
		}

		const storage = new Storage([Component]);

		const expectedPoolInfo: PoolInfo = {
			componentReference: 'Component',
			allocatedSize: 14 * 4,
			usedSize: 0,
			increaseSize: 20 * 4,
			freeSections: []
		};

		expect(storage.getPoolInfo(Component)).toStrictEqual(expectedPoolInfo);
	});

});
