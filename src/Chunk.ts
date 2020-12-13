import incrementCounter from './generators/incrementCounter';

export interface ChunkIterator {
	offsetIterator: Generator<number, void, unknown>;
	view: DataView;
}

export const DEFAULT_CHUNK_SECTION_COUNT = 1024;

class Chunk {
	constructor(sectionSize: number, maxSectionCount?: number) {
		this.sectionSize = sectionSize;
		this.maxSectionCount = maxSectionCount ?? DEFAULT_CHUNK_SECTION_COUNT;

		this.buffer = new ArrayBuffer(this.sectionSize * this.maxSectionCount);
		this.view = new DataView(this.buffer);
		this.greaterIndexUsed = 0;
	}

	public getSection = (index: number): { view: DataView, offset: number } => ({
		offset: index * this.sectionSize,
		view: this.view
	})

	// public setSection(index: number, data: ArrayBuffer): void;
	// public copySection(index: number): ArrayBuffer;
	// public moveSection(fromIndex: number, toIndex: number): void;

	public iterator = (): ChunkIterator => ({
		offsetIterator: incrementCounter(0, this.greaterIndexUsed),
		view: this.view
	})


	private readonly sectionSize: number;
	private readonly maxSectionCount: number;
	private readonly buffer: ArrayBuffer;
	private readonly view: DataView;
	private greaterIndexUsed: number;
}


export default Chunk;
