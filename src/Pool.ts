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
	readonly freeSectionsOffset: number[];
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
		this.freeSectionsOffset = [];
		this.keysToPoolOffset = new Map();
	}

	public insertSection = (key: number, sectionValue: T): T => {
		let offset: number;

		if (this.freeSectionsOffset.length >= 1) {
			offset = this.freeSectionsOffset.pop() as number;
		} else {
			offset = this.usedSize;
		}

		this.usedSize += this.sectionSize;
		this.keysToPoolOffset.set(key, offset);
		if (this.buffer.byteLength === offset) this.increaseBufferSize();

		this.sectionRef.updateView(new DataView(this.buffer, offset, this.sectionSize));
		const ref = this.sectionRef.get();
		for (const prop in ref) ref[prop] = sectionValue[prop];

		return ref;
	}

	public getSectionCount = (): number => this.usedSize / this.sectionSize

	public getKeysIterator = (): IterableIterator<number> => this.keysToPoolOffset.keys()

	public getSectionRef = (key: number): T => {
		// TODO: if key does not exist, return false or an error
		const poolOffset = this.keysToPoolOffset.get(key);

		this.sectionRef.updateView(new DataView(this.buffer, poolOffset, this.sectionSize));
		return this.sectionRef.get();
	}

	public getPoolData = (): ArrayBuffer => {
		this.defragBuffer();
		return this.buffer.slice(0, this.usedSize);
	}

	public deleteSection = (key: number): void => {
		// TODO: if key does not exist, return false or an error
		const poolOffset = this.keysToPoolOffset.get(key) as number;

		if (this.sectionSize !== 0) this.freeSectionsOffset.push(poolOffset);
		this.usedSize -= this.sectionSize;
	}

	public deleteAllSections = (): number => {
		const deletedSections = this.usedSize / this.sectionSize;
		this.buffer = new ArrayBuffer(this.bufferInitialSize);
		this.freeSectionsOffset.length = 0;
		this.usedSize = 0;
		return deletedSections;
	}


	public getInfo = (): PoolInfo => ({
		allocatedSize: this.buffer.byteLength,
		usedSize: this.usedSize,
		bufferIncreaseSize: this.bufferIncreaseSize,
		freeSectionsOffset: this.freeSectionsOffset,
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

	private defragBuffer = (): void => {
		const bufferView = new Uint8Array(this.buffer);
		let lastComponentSection = this.usedSize;
		let lastFreeSectionIndex = this.freeSectionsOffset.length - 1;

		while (this.freeSectionsOffset.length !== 0) {
			if (lastComponentSection === this.freeSectionsOffset[lastFreeSectionIndex]) {
				this.freeSectionsOffset.splice(lastFreeSectionIndex, 1);
			} else {
				bufferView.set(
					bufferView.slice(lastComponentSection, lastComponentSection + this.sectionSize),
					this.freeSectionsOffset.shift()
				);
			}
			lastComponentSection -= this.sectionSize;
			lastFreeSectionIndex -= 1;
		}

		this.usedSize = lastComponentSection + this.sectionSize;
	}


	private buffer: ArrayBuffer;
	private readonly bufferInitialSize: number;
	private readonly bufferIncreaseSize: number;
	private readonly sectionRef: Reference<T>;
	private readonly sectionSize: number;
	private readonly sectionLayout: PoolSectionLayout[];
	private usedSize: number;
	private readonly freeSectionsOffset: number[];
	private readonly keysToPoolOffset: Map<number, number>;
}

export default Pool;
