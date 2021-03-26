import { EntityQuerySpec } from '../entityQuery';


export const enum ResourceCommandId {
	CREATE = 255,
	QUERY  = 254
}

export interface EntResourceCommand {
	command: ResourceCommandId;
	count?: number;
	querySpec?: EntityQuerySpec;
}


export function createEntities(count: number): EntResourceCommand {
	// TODO: assert if count is greater than 0
	return { command: ResourceCommandId.CREATE, count: count };
}

export function queryEntities(query: EntityQuerySpec): EntResourceCommand {
	return { command: ResourceCommandId.QUERY, querySpec: query };
}
