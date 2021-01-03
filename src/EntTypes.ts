import { ReferenceSchema } from './Reference';


// Component:
const enum ComponentType {
	UNIQUE = 1,
	SHARED = 2,
	BLOB   = 3,
	EMPTY  = 4
}

export type ComponentSchema = ReferenceSchema;

export abstract class EntComponent {
	public static readonly schema: ComponentSchema;
	public static readonly type = ComponentType.UNIQUE;
}

export abstract class EntSharedComponent {
	public static readonly schema: ComponentSchema;
	public static readonly type = ComponentType.SHARED;
}

export abstract class EntBlobComponent {
	public static readonly schema: ComponentSchema;
	public static readonly type = ComponentType.BLOB;
}

export abstract class EntEmptyComponent {
	public static readonly schema: ComponentSchema;
	public static readonly type = ComponentType.EMPTY;
}

export type EntComponentTypes = EntComponent | EntSharedComponent | EntBlobComponent | EntEmptyComponent;

export interface ComponentConstructor<T> extends Function {
	new(...args: unknown[]): T;
	readonly schema: ComponentSchema;
}


// Query:
export interface EntityQuery {
	all: string[];
	not: string[];
	any: string[];
}


// Entity:
export interface Entity {
	readonly id: number;
	readonly mask: number;
}


// Script:
export abstract class EntScript {
	public abstract forEachEntity: (...components: never[]) => void;

	public abstract readonly argsType: string[];
	// public abstract readonly query: EntityQuery;
}

export interface ScriptConstructor<T> extends Function {
	new(...args: unknown[]): T;
}


// export type CommandManager = number;

// export type CommandBuffer = number;

// export type DependencyGraph = number;
