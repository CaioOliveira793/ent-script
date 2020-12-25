import Chunk, { ChunkIterator, DEFAULT_CHUNK_SECTION_COUNT } from './Chunk';
import PropType, { PropSize } from './PropType';
import LITTLE_ENDIAN from './utils/LittleEndian';


interface ComponentInfo {
	mask: number;
	index: number;
	size: number;
}

export interface GroupComponentInfo extends ComponentInfo {
	offset: number;
}

export const ID_SIZE = PropSize[PropType.U_INT_32];
export const ID_TYPE = PropType.U_INT_32;

class Group {
	constructor(componentsInfo: ComponentInfo[]) {
		this.idToIndex = new Map();

		this.orderedComponentInfo = [];
		let mask = 0, offset = ID_SIZE;
		for (const compInfo of componentsInfo) {
			// TODO: sort the order by index
			this.orderedComponentInfo.push({ ...compInfo, offset });
			mask |= compInfo.mask;
			offset += compInfo.size;
		}
		this.mask = mask;
		this.chunkSectionSize = offset;
		this.chunkSectionCount = DEFAULT_CHUNK_SECTION_COUNT;

		this.chunkList = [new Chunk(this.chunkSectionSize, this.chunkSectionCount)];
		this.freeIndex = 0;
	}

	public setSection = (id: number): { view: DataView, offset: number } => {
		this.idToIndex.set(id, this.freeIndex);

		return this.returnOrCreateChunk(this.freeIndex / this.chunkSectionCount).
			getSlice(this.freeIndex++ % this.chunkSectionCount);
	}

	public setSectionData = (id: number, orderedComponentInfo: GroupComponentInfo[], componentData: ArrayBuffer):
	{ view: DataView, offset: number, missingComponents: GroupComponentInfo[] } => {
		this.idToIndex.set(id, this.freeIndex);

		const chunk = this.returnOrCreateChunk(this.freeIndex / this.chunkSectionCount),
			index = this.freeIndex++ % this.chunkSectionCount,
			sectionDataView = new Uint8Array(this.chunkSectionSize),
			componentDataView = new Uint8Array(componentData),
			missingComponents = [...this.orderedComponentInfo];

		let i = 0, j = 0;
		while (i < orderedComponentInfo.length && j < this.orderedComponentInfo.length) {
			if (orderedComponentInfo[i].index > this.orderedComponentInfo[j].index) j++;
			else if (orderedComponentInfo[i].index < this.orderedComponentInfo[j].index) i++;
			else if (orderedComponentInfo[i].index === this.orderedComponentInfo[j].index) {
				sectionDataView.set(componentDataView.slice(
					orderedComponentInfo[i].offset,
					orderedComponentInfo[i].size
				), this.orderedComponentInfo[j].offset);
				missingComponents.splice(j++, 1);
				i++;
			}
		}
		chunk.setSlice(index, sectionDataView);
		return {
			...chunk.getSlice(index),
			missingComponents
		};
	}

	public setMultipleSections = (idList: number[], componentsData?: ArrayBuffer): void => {
		// TODO: use a better algorithm
		for (const id of idList) {
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
			.copySlice(this.freeIndex++ % this.chunkSectionCount).slice;
	}

	// TODO: add version that returns the data before delete
	public deleteSection = (id: number): void => {
		const index = this.idToIndex.get(id) as number,
			chunkIndex = Math.floor(index / this.chunkSectionCount),
			freeChunkIndex = Math.floor(this.freeIndex / this.chunkSectionCount),
			chunk = this.chunkList[chunkIndex];

		let lastId = 0;
		if (this.freeIndex - 1 !== index) {
			if (chunkIndex === freeChunkIndex) {
				const { view, offset } = chunk.moveSlice(this.freeIndex - 1, index);
				lastId = view.getUint32(offset, LITTLE_ENDIAN);
			} else {
				const { slice, view, offset } = this.chunkList[freeChunkIndex].copySlice(this.freeIndex - 1);
				chunk.setSlice(index, slice);
				lastId = view.getUint32(offset, LITTLE_ENDIAN);
			}

			this.idToIndex.set(lastId, index);
			this.idToIndex.delete(id);
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
	private freeIndex: number;
}


export default Group;
