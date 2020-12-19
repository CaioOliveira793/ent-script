import Chunk, { ChunkIterator, DEFAULT_CHUNK_SECTION_COUNT } from './Chunk';


interface ComponentInfo {
	mask: number;
	index: number;
	size: number;
}

class Group {
	constructor(componentsInfo: ComponentInfo[]) {
		this.idList = [];
		this.idToIndex = new Map();

		this.componentIndexOrder = [];
		let mask = 0, componentsSize = 0;
		for (const compInfo of componentsInfo) {
			mask |= compInfo.mask;
			componentsSize += compInfo.size;
			this.componentIndexOrder.push(compInfo.index); // TODO: sort the order by index
		}
		this.mask = mask;
		this.chunkSectionSize = componentsSize;
		this.chunkSectionCount = DEFAULT_CHUNK_SECTION_COUNT;

		this.chunkList = [new Chunk(this.chunkSectionSize, this.chunkSectionCount)];
		this.freeIndex = 0;
	}

	public setSection = (id: number): { view: DataView, offset: number } => {
		this.idList.push(id);
		this.idToIndex.set(this.freeIndex, id);

		let chunk = this.chunkList[Math.floor(this.freeIndex / this.chunkSectionCount)];
		if (!chunk) { // chunk is full
			chunk = new Chunk(this.chunkSectionSize, this.chunkSectionCount);
			this.chunkList.push(chunk);
		}
		return chunk.getSlice(this.freeIndex++ % this.chunkSectionCount);
	}

	public setMultipleSections = (idList: number[], componentsData?: ArrayBuffer): void => {
		// TODO: use a better algorithm
		for (const id of idList) {
			this.idList.push(id);
			this.idToIndex.set(this.freeIndex, id);

			let chunk = this.chunkList[Math.floor(this.freeIndex / this.chunkSectionCount)];
			if (!chunk) { // chunk is full
				chunk = new Chunk(this.chunkSectionSize, this.chunkSectionCount);
				this.chunkList.push(chunk);
			}
			if (componentsData)
				chunk.setSlice(this.freeIndex % this.chunkSectionCount, componentsData);
			this.freeIndex++;
		}
	}

	public getSection = (id: number): { view: DataView, offset: number } => {
		const index = this.idToIndex.get(id) as number;
		return this.chunkList[Math.floor(index / this.chunkSectionCount)]
			.getSlice(this.freeIndex++ % this.chunkSectionCount);
	}

	public deleteSection = (id: number): void => {
		const index = this.idToIndex.get(id) as number;
		const chunkIndex = Math.floor(index / this.chunkSectionCount)
		const freeChunkIndex = Math.floor(this.freeIndex / this.chunkSectionCount);
		const chunk = this.chunkList[chunkIndex];

		if (this.freeIndex - 1 !== index) {
			if (chunkIndex === freeChunkIndex) {
				chunk.moveSlice(this.freeIndex - 1, index);
			} else {
				const data = this.chunkList[freeChunkIndex].copySlice(this.freeIndex - 1);
				chunk.setSlice(index, data);
			}

			const lastnumber = this.idList.pop() as number;
			this.idToIndex.set(lastnumber, index);
			this.idToIndex.delete(id);
			this.idList[index] = lastnumber;
		}
		this.freeIndex--;

		// release chunk if the penultimate chunk is on
		// half of it's capacity and the last is empty
		if (this.chunkList.length - 2 >= freeChunkIndex &&
		this.freeIndex % this.chunkSectionCount <= this.chunkSectionCount / 2)
			this.chunkList.length = freeChunkIndex + 1;
	}

	public iteratorList = (): ChunkIterator[] => {
		return this.chunkList.map((chunk, index) => {
			return chunk.iterator(
				0,
				this.chunkList.length === index + 1 ?
				this.freeIndex % this.chunkSectionCount :
				this.chunkSectionCount);
		});
	}

	public getSectionCount = (): number => this.freeIndex + 1;
	public getComponentIndexOrder = (): number[] => this.componentIndexOrder;
	public getComponentsSize = (): number => this.chunkSectionSize;
	// public getSectionSize = (): number => this.chunkSectionSize + idSize;

	public readonly mask: number;


	private readonly componentIndexOrder: number[];
	private readonly chunkList: Chunk[];
	private readonly chunkSectionSize: number;
	private readonly chunkSectionCount: number;
	private readonly idToIndex: Map<number, number>;
	private readonly idList: number[]; // TODO: use ids inside chunks
	private freeIndex: number;
}


export default Group;
