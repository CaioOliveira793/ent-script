import Registry, { ComponentSchema, PoolInfo } from '../../src/index';

class TagComponent {
	public static schema: ComponentSchema = {}
}


describe('Empty components', () => {

	it('create a empty component', () => {
		const registry = new Registry([TagComponent]);
		const entity = registry.createEntity();
		const tag = registry.insertComponent<TagComponent>(entity, TagComponent);

		expect(tag).toStrictEqual({});
		expect(registry.getEntityComponentCount(entity)).toBe(1);
		expect(registry.getPoolInfo(TagComponent)).toStrictEqual({
			bufferIncreaseSize: 0,
			allocatedSize: 0,
			usedSize: 0,
			sectionSize: 0,
			sectionLayout: []
		} as PoolInfo);
	});

	it('return a empty component', () => {
		const registry = new Registry([TagComponent]);
		const entity = registry.createEntity();
		registry.insertComponent<TagComponent>(entity, TagComponent);
		const [tag] = registry.getComponents<[TagComponent]>(entity, [TagComponent]);

		expect(tag).toStrictEqual({});
	});

	it('create multiple empty components and keep buffer size to zero', () => {
		const registry = new Registry([TagComponent]);
		for (let i = 0; i < 12; i++) {
			const entity = registry.createEntity();
			registry.insertComponent<TagComponent>(entity, TagComponent);
		}
		registry.removeComponents(2, [TagComponent]);
		registry.removeComponents(5, [TagComponent]);

		expect(registry.getPoolInfo(TagComponent)).toStrictEqual({
			bufferIncreaseSize: 0,
			allocatedSize: 0,
			usedSize: 0,
			sectionSize: 0,
			sectionLayout: []
		} as PoolInfo);
	});

	it('iterate over entities that has a empty component', () => {
		const registry = new Registry([TagComponent]);
		for (let i = 0; i < 12; i++) {
			const entity = registry.createEntity();
			registry.insertComponent<TagComponent>(entity, TagComponent);
		}
		registry.removeComponents(2, [TagComponent]);
		registry.removeComponents(5, [TagComponent]);

		const entityIterator = registry.getEntitiesIteratorWith([TagComponent]);
		const entityList = [];
		for (const entity of entityIterator) {
			entityList.push(entity);
		}

		expect(entityList).toStrictEqual([0, 1, 3, 4, 6, 7, 8, 9, 10, 11]);
	});

	it('return a zero length ArrayBuffer from the empty component', () => {
		const registry = new Registry([TagComponent]);
		for (let i = 0; i < 12; i++) {
			const entity = registry.createEntity();
			registry.insertComponent<TagComponent>(entity, TagComponent);
		}
		registry.removeComponents(2, [TagComponent]);
		registry.removeComponents(5, [TagComponent]);

		const emptyComponentBuffer = registry.getComponentBuffer(TagComponent);
		expect(emptyComponentBuffer.byteLength).toBe(0);
	});

	it('return a empty iterator from the empty component buffer', () => {
		const registry = new Registry([TagComponent]);
		for (let i = 0; i < 12; i++) {
			const entity = registry.createEntity();
			registry.insertComponent<TagComponent>(entity, TagComponent);
		}
		registry.removeComponents(2, [TagComponent]);
		registry.removeComponents(5, [TagComponent]);

		const emptyComponentBuffer = registry.getComponentBuffer(TagComponent);
		const componentIterator = Registry.getComponentIteratorFromBuffer(emptyComponentBuffer, TagComponent);
		expect(componentIterator.next()).toStrictEqual({
			done: true,
			value: undefined
		});
	});

});
