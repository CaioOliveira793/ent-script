import Registry, { ComponentSchema, PoolSettings, PropType } from '../../src/index';

const POOL_INCREASE_COUNT = 2;

class Component {
	public prop1: number = 1;
	public prop_2: number = 3.1415;
	public Prop3: number = 5000;

	public static poolSettings: PoolSettings = { initialCount: 2, increaseCount: POOL_INCREASE_COUNT };
	public static schema: ComponentSchema = {
		prop1: PropType.BYTE,
		prop_2: PropType.DOUBLE,
		Prop3: PropType.INT_32,
	};
}

class ComponentWithCustomAllocator {
	public prop1: number = 1;
	public prop_2: number = 3.1415;
	public Prop3: number = 5000;

	public static poolSettings: PoolSettings = {
		initialCount: 0,
		increaseCount: POOL_INCREASE_COUNT,
		customAllocator: (oldBuffer: ArrayBuffer, deltaSize: number) => {
			if (deltaSize > 0) {
				const buffer = new ArrayBuffer(deltaSize * 5 + oldBuffer.byteLength);
				(new Uint8Array(buffer)).set(new Uint8Array(oldBuffer));
				return buffer;
			}
			return oldBuffer.slice(0, oldBuffer.byteLength + deltaSize);
		}
	};
	public static schema: ComponentSchema = {
		prop1: PropType.BYTE,
		prop_2: PropType.DOUBLE,
		Prop3: PropType.INT_32,
	};
}


describe('Component default allocator', () => {

	it('increase buffer size when insert new components', () => {
		const registry = new Registry([Component]);
		for (let i = 0; i < POOL_INCREASE_COUNT + 1; i++) {
			const entity = registry.createEntity();
			registry.insertComponent<Component>(entity, Component);
		}

		expect(registry.getPoolInfo(Component).allocatedSize)
			.toBe(registry.getPoolInfo(Component).sectionSize * (POOL_INCREASE_COUNT + 2));
	});

	it('decrease buffer size when remove components', () => {
		const registry = new Registry([Component]);

		const ent1 = registry.createEntity();
		const ent2 = registry.createEntity();
		const ent3 = registry.createEntity();
		const ent4 = registry.createEntity();
		const ent5 = registry.createEntity();
		const ent6 = registry.createEntity();
		const ent7 = registry.createEntity();

		registry.insertComponent(ent1, Component);
		registry.insertComponent(ent2, Component);
		registry.insertComponent(ent3, Component);
		registry.insertComponent(ent4, Component);
		registry.insertComponent(ent5, Component);
		registry.insertComponent(ent6, Component);
		registry.insertComponent(ent7, Component);

		registry.removeComponents(ent2, [Component]);
		registry.removeComponents(ent3, [Component]);
		registry.removeComponents(ent6, [Component]);

		const poolInfo = registry.getPoolInfo(Component);
		expect(poolInfo.bufferDeltaSize / poolInfo.sectionSize).toBe(POOL_INCREASE_COUNT);
		expect(poolInfo.allocatedSize).toBe(6 * poolInfo.sectionSize);
	});

});


describe('Component custom allocator', () => {

	it('increase buffer size with custom allocator', () => {
		const registry = new Registry([ComponentWithCustomAllocator]);
		for (let i = 0; i < POOL_INCREASE_COUNT + 1; i++) {
			const entity = registry.createEntity();
			registry.insertComponent<ComponentWithCustomAllocator>(entity, ComponentWithCustomAllocator);
		}

		expect(registry.getPoolInfo(ComponentWithCustomAllocator).allocatedSize)
			.toBe(registry.getPoolInfo(ComponentWithCustomAllocator).sectionSize * POOL_INCREASE_COUNT * 5);
	});

	it('decrease buffer size with custom allocator', () => {
		const registry = new Registry([ComponentWithCustomAllocator]);
		for (let i = 0; i < POOL_INCREASE_COUNT + 1; i++) {
			const entity = registry.createEntity();
			registry.insertComponent<ComponentWithCustomAllocator>(entity, ComponentWithCustomAllocator);
		}
		registry.removeComponents(1, [ComponentWithCustomAllocator]);

		expect(registry.getPoolInfo(ComponentWithCustomAllocator).allocatedSize)
			.toBe(registry.getPoolInfo(ComponentWithCustomAllocator).sectionSize * POOL_INCREASE_COUNT * 4);
	});

});
