import { ReferenceSchema } from './Reference';

const enum ComponentType {
	UNIQUE = 1,
	SHARED = 2,
	BLOB   = 3,
	EMPTY  = 4
}


export abstract class EntComponent {
	public static schema: ReferenceSchema;
	public static type: ComponentType.UNIQUE;
}

export abstract class EntSharedComponent {
	public static schema: ReferenceSchema;
	public static type: ComponentType.SHARED;
}

export abstract class EntBlobComponent {
	public static schema: ReferenceSchema;
	public static type: ComponentType.BLOB;
}

export abstract class EntEmptyComponent {
	public static schema: ReferenceSchema;
	public static type: ComponentType.EMPTY;
}

export type EntComponentTypes = EntComponent | EntSharedComponent | EntBlobComponent | EntEmptyComponent;


export interface ComponentConstructor<T> extends Function {
	new(...args: unknown[]): T;
	schema: ReferenceSchema;
}

export type Entity = number;

// export type EntityQuery = number;

// export type CommandManager = number;

// export type CommandBuffer = number;

// export type EntScript = number;
