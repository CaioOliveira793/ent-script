import { ReferenceSchema } from './Reference';


// Component:
export const enum ComponentType {
	EMPTY  = 1,
	UNIQUE = 2,
	SHARED = 3,
	BLOB   = 4,
}

export type ComponentSchema = ReferenceSchema;

export interface EntComponent {
	name: string;
	type: ComponentType;
	schema: ReferenceSchema;
	default: { [key: string]: number; };
	transforms?: { [key: string]: (component: never) => void; };
}

export abstract class EntEmptyComponent {
	public static type = ComponentType.EMPTY;
}

export abstract class EntUniqueComponent {
	public static schema: ReferenceSchema;
	public static default: { [key: string]: number; };
	public static transforms?: { [key: string]: (component: never) => void; };

	public static type = ComponentType.UNIQUE;
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
