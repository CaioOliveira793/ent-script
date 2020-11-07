import PropertyType, { PropertyTypeToSize } from './PropertyTypes';
import LITTLE_ENDIAN from './utils/LittleEndian';


export interface PoolSchema {
	[propertyName: string]: PropertyType;
}

export interface PoolSettings {
	initialCount: number;
	increaseCount: number;
}

export interface ComponentProperty {
	readonly name: string;
	readonly type: PropertyType;
	readonly size: number;
	readonly offset: number;
}


class Pool {
	constructor(schema: PoolSchema, settings?: PoolSettings) {
		let componentSize = 0;
		const componentLayout: ComponentProperty[] = [];

		for (const propertyName in schema) {
			const propertySize = PropertyTypeToSize[schema[propertyName]];
			componentLayout.push({
				name: propertyName,
				type: schema[propertyName],
				size: propertySize,
				offset: componentSize
			});
			componentSize += propertySize;
		}

		this.buffer = new ArrayBuffer((settings?.initialCount ?? 10) * componentSize);
		this.componentSize = componentSize;
		this.componentLayout = componentLayout;
		this.usedSize = 0;
		this.increaseSize = (settings?.increaseCount ?? 10) * componentSize;
		this.freeSections = [];
	}

	public insertComponent = <T>(component: T): { componentReference: T, poolOffset: number } => {
		let poolOffset: number;

		if (this.freeSections.length >= 1) {
			poolOffset = this.freeSections.pop() as number;
		} else {
			poolOffset = this.usedSize;
			this.usedSize += this.componentSize;
		}

		if (this.buffer.byteLength === poolOffset) {
			this.increaseBufferSize();
		}

		const poolView = new DataView(this.buffer, poolOffset, this.componentSize);
		const componentReference = this.createComponentReference<T>(poolView);
		for (const prop in componentReference) componentReference[prop] = component[prop];

		return { componentReference, poolOffset };
	}

	public getComponentReference = <T>(poolOffset: number): T => {
		const poolView = new DataView(this.buffer, poolOffset, this.componentSize);
		return this.createComponentReference<T>(poolView);
	}



	private createComponentReference = <T>(poolView: DataView): T => {
		const componentRef = {} as T;

		for (const layout of this.componentLayout) {
			switch (layout.type) {
				case PropertyType.U_INT_8:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getUint8(layout.offset),
						set: (value: number): void => poolView.setUint8(layout.offset, value)
					});
					break;

				case PropertyType.U_INT_16:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getUint16(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setUint16(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.U_INT_32:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getUint32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setUint32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.U_INT_64:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): bigint => poolView.getBigUint64(layout.offset, LITTLE_ENDIAN),
						set: (value: bigint): void => poolView.setBigUint64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_8:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getInt8(layout.offset),
						set: (value: number): void => poolView.setInt8(layout.offset, value),
					});
					break;

				case PropertyType.INT_16:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getInt16(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setInt16(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_32:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getInt32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setInt32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.INT_64:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): bigint => poolView.getBigInt64(layout.offset, LITTLE_ENDIAN),
						set: (value: bigint): void => poolView.setBigInt64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.FLOAT_32:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getFloat32(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setFloat32(layout.offset, value, LITTLE_ENDIAN),
					});
					break;

				case PropertyType.FLOAT_64:
					Object.defineProperty(componentRef, layout.name, {
						configurable: false,
						enumerable: true,
						get: (): number => poolView.getFloat64(layout.offset, LITTLE_ENDIAN),
						set: (value: number): void => poolView.setFloat64(layout.offset, value, LITTLE_ENDIAN),
					});
					break;
			}
		}

		return componentRef;
	}

	private increaseBufferSize = (): void => {
		const newLargerBuffer = new ArrayBuffer(this.buffer.byteLength + this.increaseSize);
		const oldBufferView = new Uint8Array(this.buffer);
		(new Uint8Array(newLargerBuffer)).set(oldBufferView);

		this.buffer = newLargerBuffer;
	}

	public buffer: ArrayBuffer;
	public readonly componentSize: number;
	public readonly componentLayout: ComponentProperty[];
	public usedSize: number;
	public increaseSize: number;
	public freeSections: number[];
}

export default Pool;
