import Chunk, { ChunkIterator, DEFAULT_CHUNK_SECTION_COUNT } from './Chunk';


interface ComponentInfo {
	mask: number;
	index: number;
	size: number;
}

class Group {
	constructor(componentsInfo: ComponentInfo[]) {
		this.entityList = [];
		this.entityToIndex = new Map();

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

	public setComponents = (entity: number): { view: DataView, offset: number } => {
		this.entityList.push(entity);
		this.entityToIndex.set(this.freeIndex, entity);

		let chunk = this.chunkList[Math.floor(this.freeIndex / this.chunkSectionCount)];
		if (!chunk) { // chunk is full
			chunk = new Chunk(this.chunkSectionSize);
			this.chunkList.push(chunk);
		}
		return chunk.getSection(this.freeIndex++ % this.chunkSectionCount);
	}

	public getComponents = (entity: number): { view: DataView, offset: number } => {
		const index = this.entityToIndex.get(entity) as number;
		return this.chunkList[Math.floor(index / this.chunkSectionCount)]
			.getSection(this.freeIndex++ % this.chunkSectionCount);
	}

	public deleteComponents = (entity: number): void => {
		const index = this.entityToIndex.get(entity) as number;
		const chunkIndex = Math.floor(index / this.chunkSectionCount)
		const freeChunkIndex = Math.floor(this.freeIndex / this.chunkSectionCount);
		const chunk = this.chunkList[chunkIndex];

		if (this.freeIndex - 1 !== index) {
			if (chunkIndex === freeChunkIndex) {
				chunk.moveSection(this.freeIndex - 1, index);
			} else {
				const data = this.chunkList[freeChunkIndex].copySection(this.freeIndex - 1);
				chunk.setSection(index, data);
			}

			const lastEntity = this.entityList.pop() as number;
			this.entityToIndex.set(lastEntity, index);
			this.entityToIndex.delete(entity);
			this.entityList[index] = lastEntity;
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

	public readonly mask: number;
	public readonly componentIndexOrder: number[];


	private readonly chunkList: Chunk[];
	private readonly chunkSectionSize: number;
	private readonly chunkSectionCount: number;
	private readonly entityToIndex: Map<number, number>;
	private readonly entityList: number[];
	private freeIndex: number;
}


export default Group;
