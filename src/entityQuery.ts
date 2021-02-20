import { WorldState } from "./World";


export interface EntityQuerySpec {
	all: string[];
	not: string[];
	any: string[];
}

export type EntityQuery = ArrayBuffer;


export function createEntityQuery(worldState: WorldState,
entityQuerySpec: EntityQuerySpec): EntityQuery {
	// TODO: support more than 32 (int32) components in query

	// all:
	// verification: (queriedMask & allMask) === allMask
	let allMask = 0;
	for (const componentName of entityQuerySpec.all) {
		allMask |= 1 << (worldState.componentIndex.get(componentName) as number);
	}

	// not:
	// verification: (queriedMask & allMask) === 0
	let notMask = 0;
	for (const componentName of entityQuerySpec.not) {
		notMask |= 1 << (worldState.componentIndex.get(componentName) as number);
	}

	// any:
	// verification: (queriedMask & anyMask) !== 0
	let anyMask = 0;
	for (const componentName of entityQuerySpec.any) {
		anyMask |= 1 << (worldState.componentIndex.get(componentName) as number);
	}

	return (new Uint32Array([allMask, notMask, anyMask])).buffer;
}
