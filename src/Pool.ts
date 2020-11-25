import Reference, { ReferenceSchema, ReferenceLayout } from './Reference';

export type PoolSchema = ReferenceSchema;

export type PoolSectionLayout = ReferenceLayout;

export interface PoolSettings {
	readonly initialCount: number;
	readonly increaseCount: number;
}

export interface PoolInfo {
	readonly allocatedSize: number;
	readonly usedSize: number;
	readonly bufferIncreaseSize: number;
	readonly sectionSize: number;
	readonly sectionLayout: PoolSectionLayout[];
}

export const DEFAULT_POOL_INITIAL_COUNT = 100;

export const DEFAULT_POOL_INCREASE_COUNT = 10;


export class Pool<T> {
	constructor(schema: PoolSchema, settings?: PoolSettings) {
		this.sectionRef = new Reference<T>(schema);
		this.sectionSize = this.sectionRef.getSize();
		this.sectionLayout = this.sectionRef.getLayout();

		this.bufferInitialSize = (settings?.initialCount ?? DEFAULT_POOL_INITIAL_COUNT) * this.sectionSize;
		this.bufferIncreaseSize = (settings?.increaseCount ?? DEFAULT_POOL_INCREASE_COUNT) * this.sectionSize;

		this.buffer = new ArrayBuffer(this.bufferInitialSize);
		this.usedSize = 0;
		this.keysToPoolOffset = [];
	}

	public insertSection = (key: number, sectionValue: T): T => {
		const offset = this.usedSize;

		this.usedSize += this.sectionSize;
		this.keysToPoolOffset[key] = offset;
		if (this.buffer.byteLength === offset) this.increaseBufferSize();

		this.sectionRef.updateView(new DataView(this.buffer, offset, this.sectionSize));
		const ref = this.sectionRef.get();
		for (const prop in ref) ref[prop] = sectionValue[prop];

		return ref;
	}

	public getSectionCount = (): number => this.usedSize / this.sectionSize

	public getKeysIterator = (): IterableIterator<number> => this.keysToPoolOffset.keys();

	public getSectionRef = (key: number): T => {
		const poolOffset = this.keysToPoolOffset[key];

		this.sectionRef.updateView(new DataView(this.buffer, poolOffset, this.sectionSize));
		return this.sectionRef.get();
	}

	public getPoolData = (): ArrayBuffer => {
		return this.buffer.slice(0, this.usedSize);
	}

	public deleteSection = (key: number): boolean => {
		const bufferView = new Uint8Array(this.buffer);
		const offset = this.keysToPoolOffset[key];

		if (offset === this.usedSize - this.sectionSize) {
			this.usedSize -= this.sectionSize;
			return false;
		}

		bufferView.set(bufferView.slice(this.usedSize - this.sectionSize, this.usedSize), offset);
		this.keysToPoolOffset[this.keysToPoolOffset.indexOf(this.usedSize - this.sectionSize)] = offset;
		this.keysToPoolOffset[key] = undefined as unknown as number;

		this.usedSize -= this.sectionSize;
		return true;
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
		bufferIncreaseSize: this.bufferIncreaseSize,
		sectionSize: this.sectionSize,
		sectionLayout: this.sectionLayout
	})

	//////////////////////////////////////////////////////////////////////////////////////////
	// private members ///////////////////////////////////////////////////////////////////////

	private increaseBufferSize = (): void => {
		const newLargerBuffer = new ArrayBuffer(this.buffer.byteLength + this.bufferIncreaseSize);
		const oldBufferView = new Uint8Array(this.buffer);
		(new Uint8Array(newLargerBuffer)).set(oldBufferView);

		this.buffer = newLargerBuffer;
	}


	private buffer: ArrayBuffer;
	private readonly bufferInitialSize: number;
	private readonly bufferIncreaseSize: number;
	private readonly sectionRef: Reference<T>;
	private readonly sectionSize: number;
	private readonly sectionLayout: PoolSectionLayout[];
	private usedSize: number;
	private readonly keysToPoolOffset: number[];
}

export default Pool;
