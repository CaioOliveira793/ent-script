import PropertyType, { PropertyTypeToSize } from './PropertyTypes';
import LITTLE_ENDIAN from './utils/LittleEndian';


export interface PoolSchema {
	[propertyName: string]: PropertyType;
}

export interface PoolSettings {
	initialCount: number;
	increaseCount: number;
}

export interface PoolInfo {
	readonly allocatedSize: number;
	readonly usedSize: number;
	readonly increaseSize: number;
	readonly freeSections: number[];
	readonly sectionSize: number;
	readonly sectionLayout: PoolSectionLayout[];
}

export interface PoolSectionLayout {
	readonly name: string;
	readonly type: PropertyType;
	readonly size: number;
	readonly offset: number;
}

export const DEFAULT_POOL_INITIAL_COUNT = 100;

export const DEFAULT_POOL_INCREASE_COUNT = 10;


export class Pool<T> {
	constructor(schema: PoolSchema, settings?: PoolSettings) {
		let sectionSize = 0;
		const layout: PoolSectionLayout[] = [];

		for (const propertyName in schema) {
			const propertySize = PropertyTypeToSize[schema[propertyName]];
			layout.push({
				name: propertyName,
				type: schema[propertyName],
				size: propertySize,
				offset: sectionSize
			});
			sectionSize += propertySize;
		}

		this.initialBufferSize = (settings?.initialCount ?? DEFAULT_POOL_INITIAL_COUNT) * sectionSize;
		this.buffer = new ArrayBuffer(this.initialBufferSize);
		this.sectionSize = sectionSize;
		this.sectionLayout = layout;
		this.usedSize = 0;
		this.increaseSize = (settings?.increaseCount ?? DEFAULT_POOL_INCREASE_COUNT) * sectionSize;
		this.freeSections = [];
		this.keysToPoolOffset = new Map();

		this.baseSectionReference = this.createBaseSectionReference();
		this.currentPoolView = new DataView(this.buffer);
	}

	public insertSection = (key: number, sectionValue: T): T => {
		let offset: number;

		if (this.freeSections.length >= 1) {
			offset = this.freeSections.pop() as number;
		} else {
			offset = this.usedSize;
		}

		this.usedSize += this.sectionSize;
		this.keysToPoolOffset.set(key, offset);
		if (this.buffer.byteLength === offset) this.increaseBufferSize();

		this.currentPoolView = new DataView(this.buffer, offset, this.sectionSize);
		const sectionReference = this.baseSectionReference as unknown as T;
		for (const prop in sectionReference) sectionReference[prop] = sectionValue[prop];

		return sectionReference;
	}

	public getSectionCount = (): number => {
		return this.usedSize / this.sectionSize;
	}

	public getKeysIterator = (): IterableIterator<number> => {
		return this.keysToPoolOffset.keys();
	}

	public getSectionReference = (key: number): T => {
		// TODO: if key does not exist, return false or an error
		const poolOffset = this.keysToPoolOffset.get(key);

		this.currentPoolView = new DataView(this.buffer, poolOffset, this.sectionSize);
		return this.baseSectionReference as unknown as T;
	}

	public deleteSection = (key: number): void => {
		// TODO: if key does not exist, return false or an error
		const poolOffset = this.keysToPoolOffset.get(key) as number;
		
		this.freeSections.push(poolOffset);
		this.usedSize -= this.sectionSize;
	}

	public deleteAllSections = (): number => {
		const deletedSections = this.usedSize / this.sectionSize;
		this.buffer = new ArrayBuffer(this.initialBufferSize);
		this.freeSections = [];
		this.usedSize = 0;
		return deletedSections;
	}


	public getInfo = (): PoolInfo => {
		return {
			allocatedSize: this.buffer.byteLength,
			usedSize: this.usedSize,
			increaseSize: this.increaseSize,
			freeSections: this.freeSections,
			sectionSize: this.sectionSize,
			sectionLayout: this.sectionLayout
		};
	}


	private createBaseSectionReference = (): T => {
		const baseSectionRef = {} as T;

		for (const layout of this.sectionLayout) {
			switch (layout.type) {
				case PropertyType.U_INT_8:
					Object.defineProperty(baseSectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => this.currentPoolView.getUint8(layout.offset),
						set: (value: number): void => this.currentPoolView.setUint8(layout.offset, value)
					});
					break;

				case PropertyType.U_INT_16:
					Object.defineProperty(baseSectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => this.currentPoolView.getUint16(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.currentPoolView.setUint16(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.U_INT_32:
					Object.defineProperty(baseSectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => this.currentPoolView.getUint32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.currentPoolView.setUint32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.U_INT_64:
					Object.defineProperty(baseSectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): bigint => this.currentPoolView.getBigUint64(layout.offset, LITTLE_ENDIAN),
						set: (value: bigint): void => this.currentPoolView.setBigUint64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_8:
					Object.defineProperty(baseSectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => this.currentPoolView.getInt8(layout.offset),
						set: (value: number): void => this.currentPoolView.setInt8(layout.offset, value),
					});
					break;

				case PropertyType.INT_16:
					Object.defineProperty(baseSectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => this.currentPoolView.getInt16(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.currentPoolView.setInt16(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_32:
					Object.defineProperty(baseSectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => this.currentPoolView.getInt32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.currentPoolView.setInt32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_64:
					Object.defineProperty(baseSectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): bigint => this.currentPoolView.getBigInt64(layout.offset, LITTLE_ENDIAN),
						set: (value: bigint): void => this.currentPoolView.setBigInt64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.FLOAT_32:
					Object.defineProperty(baseSectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => this.currentPoolView.getFloat32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.currentPoolView.setFloat32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.FLOAT_64:
					Object.defineProperty(baseSectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => this.currentPoolView.getFloat64(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.currentPoolView.setFloat64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;
			}
		}
		return baseSectionRef;
	}

	private increaseBufferSize = (): void => {
		const newLargerBuffer = new ArrayBuffer(this.buffer.byteLength + this.increaseSize);
		const oldBufferView = new Uint8Array(this.buffer);
		(new Uint8Array(newLargerBuffer)).set(oldBufferView);

		this.buffer = newLargerBuffer;
	}

	private buffer: ArrayBuffer;
	private readonly initialBufferSize: number;
	private readonly increaseSize: number;
	private readonly sectionSize: number;
	private readonly sectionLayout: PoolSectionLayout[];
	private usedSize: number;
	private freeSections: number[];
	private readonly keysToPoolOffset: Map<number, number>;
	private readonly baseSectionReference: T;
	private currentPoolView: DataView;
}

export default Pool;
