import { PropertyType, PropertyTypeToSize } from './PropertyTypes';
import LITTLE_ENDIAN from './utils/LittleEndian';

export interface ReferenceSchema {
	[propertyName: string]: PropertyType;
}

export interface ReferenceLayout {
	readonly name: string;
	readonly type: PropertyType;
	readonly size: number;
	readonly offset: number;
}


export class Reference<T> {
	constructor(schema: ReferenceSchema, view?: DataView) {
		const sectionLayout: ReferenceLayout[] = [];
		let offset = 0;
		for (const propertyName in schema) {
			const size = PropertyTypeToSize[schema[propertyName]];
			sectionLayout.push({
				name: propertyName,
				type: schema[propertyName],
				size,
				offset
			});
			offset += size;
		}

		this.size = offset;
		this.layout = sectionLayout;
		this.view = view ?? new DataView(new ArrayBuffer(this.size));
		this.ref = {} as T;

		for (const layout of sectionLayout) {
			switch (layout.type) {
				case PropertyType.U_INT_8:
					Object.defineProperty(this.ref, layout.name, {
						enumerable: true,
						get: (): number => this.view.getUint8(layout.offset),
						set: (value: number): void => this.view.setUint8(layout.offset, value)
					});
					break;

				case PropertyType.U_INT_16:
					Object.defineProperty(this.ref, layout.name, {
						enumerable: true,
						get: (): number => this.view.getUint16(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.view.setUint16(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.U_INT_32:
					Object.defineProperty(this.ref, layout.name, {
						enumerable: true,
						get: (): number => this.view.getUint32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.view.setUint32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.U_INT_64:
					Object.defineProperty(this.ref, layout.name, {
						enumerable: true,
						get: (): bigint => this.view.getBigUint64(layout.offset, LITTLE_ENDIAN),
						set: (value: bigint): void => this.view.setBigUint64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_8:
					Object.defineProperty(this.ref, layout.name, {
						enumerable: true,
						get: (): number => this.view.getInt8(layout.offset),
						set: (value: number): void => this.view.setInt8(layout.offset, value),
					});
					break;

				case PropertyType.INT_16:
					Object.defineProperty(this.ref, layout.name, {
						enumerable: true,
						get: (): number => this.view.getInt16(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.view.setInt16(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_32:
					Object.defineProperty(this.ref, layout.name, {
						enumerable: true,
						get: (): number => this.view.getInt32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.view.setInt32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_64:
					Object.defineProperty(this.ref, layout.name, {
						enumerable: true,
						get: (): bigint => this.view.getBigInt64(layout.offset, LITTLE_ENDIAN),
						set: (value: bigint): void => this.view.setBigInt64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.FLOAT_32:
					Object.defineProperty(this.ref, layout.name, {
						enumerable: true,
						get: (): number => this.view.getFloat32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.view.setFloat32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.FLOAT_64:
					Object.defineProperty(this.ref, layout.name, {
						enumerable: true,
						get: (): number => this.view.getFloat64(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => this.view.setFloat64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;
			}
		}
	}

	public get = (): T => this.ref;
	public getSize = (): number => this.size;
	public getLayout = (): ReferenceLayout[] => this.layout;

	public updateView = (view: DataView): void => { this.view = view; }


	private readonly ref: T;
	private readonly size: number;
	private readonly layout: ReferenceLayout[];
	private view: DataView;
}

export default Reference;
