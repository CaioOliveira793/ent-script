import PropertyType from './PropertyTypes';
import { ReferenceSchema } from './Reference';

export abstract class EntComponent {
	public static schema: ReferenceSchema;
}

export abstract class EntTagComponent {
	public static schema: ReferenceSchema;
}

export abstract class EntSharedComponent {
	public static schema: ReferenceSchema;
	public static shared = true;
}

export interface ComponentConstructor<T> extends Function {
	new(...args: unknown[]): T;
	schema: ReferenceSchema;
}

export type Entity = number;

export type GroupType = string[];

// export type EntityQuery = number;

// export type CommandManager = number;

// export type CommandBuffer = number;

// export type EntScript = number;


class MeshComponent extends EntSharedComponent {
}