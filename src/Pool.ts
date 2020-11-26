import Reference, { ReferenceSchema, ReferenceLayout } from './Reference';

export type PoolSchema = ReferenceSchema;

export type PoolSectionLayout = ReferenceLayout;

export interface PoolSettings {
	readonly initialCount?: number;
	readonly increaseCount?: number;
	readonly customAllocator?: (oldBuffer: ArrayBuffer, deltaSize: number) => ArrayBuffer;
}

export interface PoolInfo {
	readonly allocatedSize: number;
	readonly usedSize: number;
	readonly bufferDeltaSize: number;
	readonly sectionSize: number;
	readonly sectionLayout: PoolSectionLayout[];
}

export const DEFAULT_POOL_INITIAL_COUNT = 1024;

export const DEFAULT_POOL_INCREASE_COUNT = DEFAULT_POOL_INITIAL_COUNT / 4;


export class Pool<T> {
	constructor(schema: PoolSchema, settings?: PoolSettings) {
		this.sectionRef = new Reference<T>(schema);
		this.sectionSize = this.sectionRef.getSize();
		this.sectionLayout = this.sectionRef.getLayout();

		this.bufferInitialSize = (settings?.initialCount ?? DEFAULT_POOL_INITIAL_COUNT) * this.sectionSize;
		this.bufferDeltaSize = (settings?.increaseCount ?? DEFAULT_POOL_INCREASE_COUNT) * this.sectionSize;
		this.customAllocator = settings?.customAllocator;

		this.buffer = new ArrayBuffer(this.bufferInitialSize);
		this.usedSize = 0;
		this.keysToPoolOffset = [];

		this.sectionRef.updateView(new DataView(this.buffer));
	}

	public insertSection = (key: number, sectionValue: T): T => {
		const offset = this.usedSize;

		this.usedSize += this.sectionSize;
		this.keysToPoolOffset[key] = offset;
		if (this.buffer.byteLength <= offset) this.increaseBufferSize();

		this.sectionRef.updateOffset(offset);
		const ref = this.sectionRef.get();
		for (const prop in ref) ref[prop] = sectionValue[prop];

		return ref;
	}

	public getSectionCount = (): number => this.usedSize / this.sectionSize

	public getKeysIterator = (): IterableIterator<number> => this.keysToPoolOffset.keys();

	public getSectionRef = (key: number): T => {
		this.sectionRef.updateOffset(this.keysToPoolOffset[key]);
		return this.sectionRef.get();
	}

	public getPoolData = (): ArrayBuffer => this.buffer.slice(0, this.usedSize);

	public deleteSection = (key: number): boolean => {
		const bufferView = new Uint8Array(this.buffer);
		const offset = this.keysToPoolOffset[key];
		let deleted = false;

		if (offset !== this.usedSize - this.sectionSize) {
			bufferView.set(bufferView.slice(this.usedSize - this.sectionSize, this.usedSize), offset);
			this.keysToPoolOffset[this.keysToPoolOffset.indexOf(this.usedSize - this.sectionSize)] = offset;
			this.keysToPoolOffset[key] = undefined as unknown as number;
			deleted = true;
		}

		this.usedSize -= this.sectionSize;
		if (this.buffer.byteLength - (2 * this.bufferDeltaSize) >= this.usedSize) this.decreaseBufferSize();
		return deleted;
	}

	public deleteAllSections = (): number => {
		const deletedSections = this.usedSize / this.sectionSize;
		this.buffer = new ArrayBuffer(this.bufferInitialSize);
		this.usedSize = 0;
		return deletedSections;
	}


	public getInfo = (): PoolInfo => ({
		allocatedSize: this.buffer.byteLength,
		usedSize: this.usedSize,
		bufferDeltaSize: this.bufferDeltaSize,
		sectionSize: this.sectionSize,
		sectionLayout: this.sectionLayout
	})

	//////////////////////////////////////////////////////////////////////////////////////////
	// private members ///////////////////////////////////////////////////////////////////////

	private increaseBufferSize = (): void => {
		if (this.customAllocator) {
			this.buffer = this.customAllocator(this.buffer, this.bufferDeltaSize);
			this.sectionRef.updateView(new DataView(this.buffer));
			return;
		}

		const newLargerBuffer = new ArrayBuffer(this.buffer.byteLength + this.bufferDeltaSize);
		const oldBufferView = new Uint8Array(this.buffer);
		(new Uint8Array(newLargerBuffer)).set(oldBufferView);
		this.buffer = newLargerBuffer;
		this.sectionRef.updateView(new DataView(this.buffer));
	}

	private decreaseBufferSize = (): void => {
		if (this.customAllocator) {
			this.buffer = this.customAllocator(this.buffer, -this.bufferDeltaSize);
			this.sectionRef.updateView(new DataView(this.buffer));
			return;
		}

		this.buffer = this.buffer.slice(0, this.buffer.byteLength - this.bufferDeltaSize);
		this.sectionRef.updateView(new DataView(this.buffer));
	}


	private buffer: ArrayBuffer;
	private readonly bufferInitialSize: number;
	private readonly bufferDeltaSize: number;
	private readonly customAllocator?: (oldBuffer: ArrayBuffer, deltaSize: number) => ArrayBuffer;
	private readonly sectionRef: Reference<T>;
	private readonly sectionSize: number;
	private readonly sectionLayout: PoolSectionLayout[];
	private usedSize: number;
	private readonly keysToPoolOffset: number[];
}

export default Pool;
