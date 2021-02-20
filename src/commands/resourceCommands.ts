import { EntityQuerySpec } from '../entityQuery';


export const enum ResourceCmd {
	CREATE = 255,
	QUERY  = 254
}

export interface EntResourceCommand {
	command: ResourceCmd;
	count?: number;
	querySpec?: EntityQuerySpec;
}


export function createEntities(count: number): EntResourceCommand {
	// TODO: assert if count is greater than 0
	return { command: ResourceCmd.CREATE, count: count };
}

export function queryEntities(query: EntityQuerySpec): EntResourceCommand {
	return { command: ResourceCmd.QUERY, querySpec: query };
}
