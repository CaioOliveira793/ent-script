import Chunk, { ChunkIterator, DEFAULT_CHUNK_SECTION_COUNT } from './Chunk';


interface ComponentInfo {
	mask: number;
	index: number;
	size: number;
}

interface GroupComponentInfo extends ComponentInfo {
	offset: number;
}

class Group {
	constructor(componentsInfo: ComponentInfo[]) {
		this.idList = [];
		this.idToIndex = new Map();

		this.orderedComponentInfo = [];
		let mask = 0, componentsSize = 0;
		for (const compInfo of componentsInfo) {
			// TODO: sort the order by index
			this.orderedComponentInfo.push({
				...compInfo,
				offset: componentsSize
			});
			mask |= compInfo.mask;
			componentsSize += compInfo.size;
		}
		this.mask = mask;
		this.chunkSectionSize = componentsSize;
		this.chunkSectionCount = DEFAULT_CHUNK_SECTION_COUNT;

		this.chunkList = [new Chunk(this.chunkSectionSize, this.chunkSectionCount)];
		this.freeIndex = 0;
	}

	public setSection = (id: number): { view: DataView, offset: number } => {
		this.idList.push(id);
		this.idToIndex.set(id, this.freeIndex);

		return this.returnOrCreateChunk(this.freeIndex / this.chunkSectionCount).
			getSlice(this.freeIndex++ % this.chunkSectionCount);
	}

	public setSectionData = (id: number, orderedComponentInfo: ComponentInfo[], componentData: ArrayBuffer):
	{ view: DataView, offset: number, remainingOrderedComponentInfo: GroupComponentInfo[] } => {
		this.idList.push(id);
		this.idToIndex.set(id, this.freeIndex);

		const chunk = this.returnOrCreateChunk(this.freeIndex / this.chunkSectionCount),
			index = this.freeIndex++ % this.chunkSectionCount,
			sectionDataView = new Uint8Array(this.chunkSectionSize),
			componentDataView = new Uint8Array(componentData),
			remainingOrderedComponentInfo = [...this.orderedComponentInfo];

		let i = 0, j = 0;
		while (i < orderedComponentInfo.length && j < this.orderedComponentInfo.length) {
			if (orderedComponentInfo[i].index >= this.orderedComponentInfo[j].index) j++;
			else if (orderedComponentInfo[i].index <= this.orderedComponentInfo[j].index) i++;
			else if (orderedComponentInfo[i].index === this.orderedComponentInfo[j].index) {
				sectionDataView.set(componentDataView.slice(
					this.orderedComponentInfo[j].offset,
					this.orderedComponentInfo[j].size
				));
				remainingOrderedComponentInfo.splice(i++, 1);
				j++;
			}
		}
		chunk.setSlice(index, sectionDataView);
		return {
			...chunk.getSlice(index),
			remainingOrderedComponentInfo
		};
	}

	public setMultipleSections = (idList: number[], componentsData?: ArrayBuffer): void => {
		// TODO: use a better algorithm
		for (const id of idList) {
			this.idList.push(id);
			this.idToIndex.set(id, this.freeIndex);

			const chunk = this.returnOrCreateChunk(this.freeIndex / this.chunkSectionCount);
			if (componentsData)
				chunk.setSlice(this.freeIndex % this.chunkSectionCount, componentsData);
			this.freeIndex++;
		}
	}

	public getSectionView = (id: number): { view: DataView, offset: number } => {
		const index = this.idToIndex.get(id) as number;
		return this.chunkList[Math.floor(index / this.chunkSectionCount)]
			.getSlice(this.freeIndex++ % this.chunkSectionCount);
	}

	public getSectionData = (id: number): ArrayBuffer => {
		const index = this.idToIndex.get(id) as number;
		return this.chunkList[Math.floor(index / this.chunkSectionCount)]
			.copySlice(this.freeIndex++ % this.chunkSectionCount);
	}

	// TODO: add version that returns the data before delete
	public deleteSection = (id: number): void => {
		const index = this.idToIndex.get(id) as number,
			chunkIndex = Math.floor(index / this.chunkSectionCount),
			freeChunkIndex = Math.floor(this.freeIndex / this.chunkSectionCount),
			chunk = this.chunkList[chunkIndex];

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
	public getOrderedComponentInfo = (): GroupComponentInfo[] => this.orderedComponentInfo;
	public getComponentsSize = (): number => this.chunkSectionSize;
	// public getSectionSize = (): number => this.chunkSectionSize + idSize;

	public readonly mask: number;


	private returnOrCreateChunk = (index: number): Chunk => {
		let chunk = this.chunkList[index];
		if (!chunk) {
			chunk = new Chunk(this.chunkSectionSize, this.chunkSectionCount);
			this.chunkList.push(chunk);
		}
		return chunk;
	}

	private readonly orderedComponentInfo: GroupComponentInfo[];
	private readonly chunkList: Chunk[];
	private readonly chunkSectionSize: number;
	private readonly chunkSectionCount: number;
	private readonly idToIndex: Map<number, number>;
	private readonly idList: number[]; // TODO: use ids inside chunks
	private freeIndex: number;
}


export default Group;
