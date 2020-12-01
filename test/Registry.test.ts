import Registry, {
	ComponentSchema, ComponentConstructor, ComponentInfo, PoolSettings,
	PoolInfo, PropertyType, PropertyTypeToSize, REGISTRY_MAX_COMPONENTS
} from '../src/index';


describe('Registry construction', () => {

	it('throw an error when no component is passed', () => {
		expect(() => new Registry([]))
			.toThrowError('no component was supplied in the Registry constructor');
	});

	it('throw an error when exceed the max number of components', () => {
		class Component {
			static schema: ComponentSchema = { property: PropertyType.INT_32 };
		}

		const componentsList: ComponentConstructor<Component>[] = [];
		for (let i = 0; i < REGISTRY_MAX_COMPONENTS + 1; i++) {
			componentsList.push(Component);
		}

		expect(() => new Registry(componentsList))
			.toThrowError('32 components is the max number supported per Registry');
	});

	it('create a pool with the component', () => {
		class Component {
			static schema: ComponentSchema = { property: PropertyType.BYTE };
		}

		const registry = new Registry([Component]);

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

		expect(registry.getComponentInfo(Component)).toStrictEqual(expectedComponentInfo);
	});

	it('create a pool with the specified settings', () => {
		class Component {
			static schema: ComponentSchema = { property: PropertyType.FLOAT_32 };
			static poolSettings: PoolSettings = {
				initialCount: 14,
				increaseCount: 20
			};
		}

		const registry = new Registry([Component]);

		const expectedPoolInfo: PoolInfo = {
			allocatedSize: 14 * PropertyTypeToSize[PropertyType.FLOAT_32],
			usedSize: 0,
			bufferDeltaSize: 20 * PropertyTypeToSize[PropertyType.FLOAT_32],
			sectionSize: PropertyTypeToSize[PropertyType.FLOAT_32],
			sectionLayout: [{
				name: 'property',
				offset: 0,
				size: PropertyTypeToSize[PropertyType.FLOAT_32],
				type: PropertyType.FLOAT_32
			}]
		};

		expect(registry.getPoolInfo(Component)).toStrictEqual(expectedPoolInfo);
	});

});
