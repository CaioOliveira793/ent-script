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

export type SectionKey = number | string;

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
		this.keysToPoolOffset = new Map;
		this.insertedKeys = [];

		this.sectionRef.updateView(new DataView(this.buffer));
	}

	public insertSection = (key: SectionKey, sectionValue: T): T => {
		const offset = this.usedSize;

		this.usedSize += this.sectionSize;
		this.keysToPoolOffset.set(key, offset);
		this.insertedKeys.push(key);
		if (this.buffer.byteLength <= offset) this.increaseBufferSize();

		this.sectionRef.updateOffset(offset);
		const ref = this.sectionRef.get();
		for (const prop in ref) ref[prop] = sectionValue[prop];

		return ref;
	}

	public getSectionCount = (): number => this.usedSize / this.sectionSize

	public getKeysIterator = (): IterableIterator<SectionKey> => this.keysToPoolOffset.keys();

	public getSectionRef = (key: SectionKey): T => {
		this.sectionRef.updateOffset(this.keysToPoolOffset.get(key) as number);
		return this.sectionRef.get();
	}

	public getPoolData = (): ArrayBuffer => this.buffer.slice(0, this.usedSize);

	public deleteSection = (key: SectionKey): boolean => {
		const bufferView = new Uint8Array(this.buffer);
		const offset = this.keysToPoolOffset.get(key) as number;
		let deleted = false;

		if (offset !== this.usedSize - this.sectionSize) {
			bufferView.set(bufferView.slice(this.usedSize - this.sectionSize, this.usedSize), offset);
			const lastKey = this.insertedKeys.pop() as SectionKey;
			this.keysToPoolOffset.set(lastKey, offset);
			this.keysToPoolOffset.delete(key);
			this.insertedKeys[offset / this.sectionSize] = lastKey;
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
		this.keysToPoolOffset.clear();
		this.insertedKeys.length = 0;
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
	private readonly keysToPoolOffset: Map<SectionKey, number>;
	private readonly insertedKeys: SectionKey[];
}

export default Pool;
