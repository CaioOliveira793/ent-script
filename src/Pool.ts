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


class Pool {
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

		this.buffer = new ArrayBuffer((settings?.initialCount ?? 10) * sectionSize);
		this.sectionSize = sectionSize;
		this.sectionLayout = layout;
		this.usedSize = 0;
		this.increaseSize = (settings?.increaseCount ?? 10) * sectionSize;
		this.freeSections = [];
	}

	public insertSection = <T>(section: T): { sectionReference: T, offset: number } => {
		let offset: number;

		if (this.freeSections.length >= 1) {
			offset = this.freeSections.pop() as number;
		} else {
			offset = this.usedSize;
			this.usedSize += this.sectionSize;
		}

		if (this.buffer.byteLength === offset) {
			this.increaseBufferSize();
		}

		const poolView = new DataView(this.buffer, offset, this.sectionSize);
		const sectionReference = this.createSectionReference<T>(poolView);
		for (const prop in sectionReference) sectionReference[prop] = section[prop];

		return { sectionReference, offset };
	}

	public getSectionReference = <T>(poolOffset: number): T => {
		const poolView = new DataView(this.buffer, poolOffset, this.sectionSize);
		return this.createSectionReference<T>(poolView);
	}

	public deleteSection = (poolOffset: number): void => {
		this.freeSections.push(poolOffset);
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



	private createSectionReference = <T>(poolView: DataView): T => {
		const sectionRef = {} as T;

		for (const layout of this.sectionLayout) {
			switch (layout.type) {
				case PropertyType.U_INT_8:
					Object.defineProperty(sectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getUint8(layout.offset),
						set: (value: number): void => poolView.setUint8(layout.offset, value)
					});
					break;

				case PropertyType.U_INT_16:
					Object.defineProperty(sectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getUint16(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setUint16(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.U_INT_32:
					Object.defineProperty(sectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getUint32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setUint32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.U_INT_64:
					Object.defineProperty(sectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): bigint => poolView.getBigUint64(layout.offset, LITTLE_ENDIAN),
						set: (value: bigint): void => poolView.setBigUint64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_8:
					Object.defineProperty(sectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getInt8(layout.offset),
						set: (value: number): void => poolView.setInt8(layout.offset, value),
					});
					break;

				case PropertyType.INT_16:
					Object.defineProperty(sectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getInt16(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setInt16(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_32:
					Object.defineProperty(sectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getInt32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setInt32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_64:
					Object.defineProperty(sectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): bigint => poolView.getBigInt64(layout.offset, LITTLE_ENDIAN),
						set: (value: bigint): void => poolView.setBigInt64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.FLOAT_32:
					Object.defineProperty(sectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getFloat32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setFloat32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.FLOAT_64:
					Object.defineProperty(sectionRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getFloat64(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setFloat64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;
			}
		}

		return sectionRef;
	}

	private increaseBufferSize = (): void => {
		const newLargerBuffer = new ArrayBuffer(this.buffer.byteLength + this.increaseSize);
		const oldBufferView = new Uint8Array(this.buffer);
		(new Uint8Array(newLargerBuffer)).set(oldBufferView);

		this.buffer = newLargerBuffer;
	}

	private buffer: ArrayBuffer;
	private readonly sectionSize: number;
	private readonly sectionLayout: PoolSectionLayout[];
	private usedSize: number;
	private increaseSize: number;
	private freeSections: number[];
}

export default Pool;
