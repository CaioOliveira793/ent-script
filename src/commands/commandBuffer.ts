import { EntResourceCommand, ResourceCommandId } from './resourceCommands';
import { EntStructuralCommand, StructuralCommandId } from './structuralCommands';
import { WorldState } from '../World';
import { createEntityQuery, EntityQuerySpec } from '../entityQuery';
import LITTLE_ENDIAN from '../utils/LittleEndian';


export type CommandBuffer = ArrayBuffer;

function resourceCommandParser(worldState: WorldState, resourceCommand: EntResourceCommand): ArrayBuffer {
	switch (resourceCommand.command) {
		case ResourceCommandId.CREATE: {
			// [command (1) + entityCount (2)]
			const buffer = new ArrayBuffer(3);
			const view = new DataView(buffer);
			view.setUint8(0, resourceCommand.command);
			view.setUint16(1, resourceCommand.count as number); // max of 65536 entities
			return buffer;
		}

		case ResourceCommandId.QUERY: {
			return createEntityQuery(worldState, resourceCommand.querySpec as EntityQuerySpec);
		}
	}
}

function structuralCommandParser(worldState: WorldState,
structuralCommand: EntStructuralCommand): ArrayBuffer {
	switch (structuralCommand.command) {
		case StructuralCommandId.ADD_TAG:
		case StructuralCommandId.ADD_UNIQUE_DEFAULT:
		case StructuralCommandId.REMOVE_TAG:
		case StructuralCommandId.REMOVE_UNIQUE:
		case StructuralCommandId.REMOVE_SHARED:
		case StructuralCommandId.REMOVE_BLOB: {
			// [command (1) + componentIndex (2)]
			const buffer = new ArrayBuffer(3);
			const view = new DataView(buffer);
			view.setUint8(0, structuralCommand.command);
			view.setUint16(
				1,
				// max of 65536 diferent components
				worldState.componentIndex.get(structuralCommand.param as string) as number,
				LITTLE_ENDIAN
			);
			return buffer;
		}

		// case StructuralCmd.ADD_UNIQUE_TRANSFORM:
		// case StructuralCmd.ADD_SHARED:
		// case StructuralCmd.ADD_BLOB:

		case StructuralCommandId.REMOVE_ALL_COMPONENT:
		case StructuralCommandId.DESTROY_ENTITY: {
			// [command (1)]
			return new Uint8Array([structuralCommand.command]).buffer;
		}

		default:
			throw new Error('something went wrong in structural command parsing');
	}
}


export function createCommandBuffer(worldState: WorldState, resourceCommand: EntResourceCommand,
...structuralCommands: EntStructuralCommand[]): CommandBuffer {
	const resourceCommandBuffer = resourceCommandParser(worldState, resourceCommand);
	let commandBufferLength = resourceCommandBuffer.byteLength,
		offset = resourceCommandBuffer.byteLength;

	const structuralCommandBufferList = [];
	for (const structuralCommand of structuralCommands) {
		const structuralCommandBuffer = structuralCommandParser(worldState, structuralCommand);
		structuralCommandBufferList.push(structuralCommandBuffer);
		commandBufferLength += structuralCommandBuffer.byteLength;
	}

	const commandBuffer = new Uint8Array(commandBufferLength);
	commandBuffer.set(new Uint8Array(resourceCommandBuffer));

	for (const structuralCommandBuffer of structuralCommandBufferList) {
		commandBuffer.set(new Uint8Array(structuralCommandBuffer), offset);
		offset += structuralCommandBuffer.byteLength;
	}

	return commandBuffer;
}
