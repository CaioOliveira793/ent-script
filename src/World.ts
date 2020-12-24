import EntManager from './EntManager';
import { ComponentConstructor, EntComponent, EntSharedComponent } from './EntTypes';


// interface WorldConfig {
// 	shared: boolean;
// }


class World {
	constructor(components: ComponentConstructor<EntComponent | EntSharedComponent>[], /* config: WorldConfig */) {


		this.EntManager = new EntManager(components, /* allocator */);
	}

	public EntManager: EntManager;

	// public addScript(script: EntScript): string;
	// public enableScript(name: string): void;
	// public desableScript(name: string): void;

	// public schedule(): DependencyGraph;
	// public execute(): void;

	// public serializeStructuralDiff(): unknown;
	// public serializeData(): unknown;


	////////////////////////////////////////////////////////////
	// private /////////////////////////////////////////////////

	// private entManagerExposedData: EntManagerExposedData;
	// private allocator = (): void => {}


	////////////////////////////////////////////////////////////
	// static //////////////////////////////////////////////////

	// public static deserializeStructuralDiff(): unknown;
	// public static deserializeData(): unknown;

	// public static addScript(script: EntScript): string;
	// public static executeScript(name: string): void;
}


export default World;
