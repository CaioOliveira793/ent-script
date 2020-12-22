import incrementCounter from './generators/incrementCounter';

export interface ChunkIterator {
	offsetIterator: Generator<number, void, unknown>;
	view: DataView;
}

export const DEFAULT_CHUNK_SECTION_COUNT = 1024;

class Chunk {
	constructor(sectionSize: number, maxSectionCount: number = DEFAULT_CHUNK_SECTION_COUNT) {
		this.sectionSize = sectionSize;
		this.sectionCount = maxSectionCount;

		this.buffer = new ArrayBuffer(this.sectionSize * this.sectionCount);
		this.view = new DataView(this.buffer);
		this.byteView = new Uint8Array(this.buffer);
	}

	public getSlice = (index: number): { view: DataView, offset: number } => ({
		offset: index * this.sectionSize,
		view: this.view
	})

	public setSlice = (index: number, data: ArrayBuffer): void => {
		this.byteView.set(new Uint8Array(data), index * this.sectionSize);
	}

	public copySlice = (index: number): ArrayBuffer =>
		this.buffer.slice(index * this.sectionSize, this.sectionSize);

	public moveSlice = (fromIndex: number, toIndex: number): void => {
		this.byteView.set(
			this.byteView.slice(fromIndex * this.sectionSize, fromIndex * this.sectionSize + this.sectionSize),
			toIndex * this.sectionSize
		);
	}

	public iterator = (initialIndex: number, limitIndex: number = this.sectionCount): ChunkIterator => ({
		offsetIterator: incrementCounter(initialIndex, limitIndex),
		view: this.view
	})


	private readonly sectionSize: number;
	private readonly sectionCount: number;
	private readonly buffer: ArrayBuffer;
	private readonly view: DataView;
	private readonly byteView: Uint8Array;
}


export default Chunk;
