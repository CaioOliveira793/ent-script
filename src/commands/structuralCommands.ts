export const enum StructuralCommandId {
	ADD_TAG               = 1,
	ADD_UNIQUE_DEFAULT    = 2,
	ADD_UNIQUE_TRANSFORM  = 3,
	ADD_SHARED            = 4,
	ADD_BLOB              = 5,

	REMOVE_TAG            = 6,
	REMOVE_UNIQUE         = 7,
	REMOVE_SHARED         = 8,
	REMOVE_BLOB           = 9,

	REMOVE_ALL_COMPONENT  = 10,
	DESTROY_ENTITY        = 11,
}

export interface EntStructuralCommand {
	command: StructuralCommandId;
	param?: string;
	transform?: string;
}


export function addTagComponent(component: string): EntStructuralCommand {
	return {
		command: StructuralCommandId.ADD_TAG,
		param: component
	};
}

export function addUniqueComponent(component: string, transform?: string, /* data?: unknown */): EntStructuralCommand {
	return {
		command: (transform) ? StructuralCommandId.ADD_UNIQUE_TRANSFORM : StructuralCommandId.ADD_UNIQUE_DEFAULT,
		param: component,
		transform
	};
}

// function addSharedComponent(): EntStructuralCommand {}

// function addBlobComponent(): EntStructuralCommand {}


export function removeTagComponent(component: string): EntStructuralCommand {
	return {
		command: StructuralCommandId.REMOVE_TAG,
		param: component
	};
}

export function removeUniqueComponent(component: string): EntStructuralCommand {
	return {
		command: StructuralCommandId.REMOVE_TAG,
		param: component
	};
}

// function removeSharedComponent(): EntStructuralCommand {}

// function removeBlobComponent(): EntStructuralCommand {}


export function destroyEntities(): EntStructuralCommand {
	return { command: StructuralCommandId.DESTROY_ENTITY };
}

// function removeAllComponents(): EntStructuralCommand {}
