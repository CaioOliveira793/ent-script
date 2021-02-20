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
	default: {
		[key: string]: number; // supported types
	}
	transforms?: {
		[key: string]: (component: never) => void;
	}
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


// export type DependencyGraph = number;
