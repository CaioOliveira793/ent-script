import Registry, { ComponentSchema, PoolSettings, PropType } from '../src/index';

const POOL_INCREASE_COUNT = 5;

class Component {
	public u_int_8: number = 250;
	public u_int_16: number = 65000;
	public u_int_32: number = 4200000000;
	public u_int_64: bigint = BigInt(8446744073709551615);

	public int_8: number = -120;
	public int_16: number = -32000;
	public int_32: number = -2100000000;
	public int_64: bigint = BigInt(-844674407370955);

	public float_32: number = 3.141592653589793238;
	public float_64: number = 3.14159265358979323846264338327950288;

	public static poolSettings: PoolSettings = {
		initialCount: 0,
		increaseCount: POOL_INCREASE_COUNT
	};
	public static schema: ComponentSchema = {
		u_int_8: PropType.U_INT_8,
		u_int_16: PropType.U_INT_16,
		u_int_32: PropType.U_INT_32,
		u_int_64: PropType.U_INT_64,

		int_8: PropType.INT_8,
		int_16: PropType.INT_16,
		int_32: PropType.INT_32,
		int_64: PropType.INT_64,

		float_32: PropType.FLOAT_32,
		float_64: PropType.FLOAT_64,
	};
}


describe('Property Types', () => {

	it('create a reference for unsigned int 8 type', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);
		expect(componentRef.u_int_8).toBe(250);
	});

	it('create a reference for unsigned int 16 type', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);
		expect(componentRef.u_int_16).toBe(65000);
	});

	it('create a reference for unsigned int 32 type', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);
		expect(componentRef.u_int_32).toBe(4200000000);
	});

	it('create a reference for unsigned int 64 type', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);
		expect(componentRef.u_int_64).toBe(BigInt(8446744073709551615));
	});


	it('create a reference for signed int 8 type', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);
		expect(componentRef.int_8).toBe(-120);
	});

	it('create a reference for signed int 16 type', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);
		expect(componentRef.int_16).toBe(-32000);
	});

	it('create a reference for signed int 32 type', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);
		expect(componentRef.int_32).toBe(-2100000000);
	});

	it('create a reference for signed int 64 type', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);
		expect(componentRef.int_64).toBe(BigInt(-844674407370955));
	});


	it('create a reference for float 32 type', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);
		expect(componentRef.float_32).toBeGreaterThanOrEqual(3.141592653589793238);
	});

	it('create a reference for float 64 type', () => {
		const registry = new Registry([Component]);
		const entity = registry.createEntity();
		const componentRef = registry.insertComponent<Component>(entity, Component);
		expect(componentRef.float_32).toBeGreaterThanOrEqual(3.14159265358979323846264338327950288);
	});

});
