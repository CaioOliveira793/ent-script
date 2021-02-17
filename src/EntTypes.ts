import { ReferenceSchema } from './Reference';


// Component:
export const enum ComponentType {
	EMPTY  = 1,
	UNIQUE = 2,
	SHARED = 3,
	BLOB   = 4,
}

export type ComponentSchema = ReferenceSchema;

export interface EntComponentSpec {
	name: string;
	schema: ComponentSchema;
	type: ComponentType;
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
