import EntManager, { ComponentMapProps } from './EntManager';
import Group from './Group';
import Reference from './Reference';
import { ComponentConstructor, EntComponent, EntSharedComponent, EntScript,
ScriptConstructor, EntComponentTypes } from './EntTypes';


// interface WorldConfig {
// 	shared: boolean;
// }

interface ScriptMapProps {
	script: EntScript;
	queryMask: number;
	refList: Reference<EntComponentTypes>[];
	componentIndexList: number[];
}


class World {
	constructor(componentsConstructor: ComponentConstructor<EntComponent | EntSharedComponent>[],
	/* config: WorldConfig */) {
		this.scriptMap = new Map();
		this.scheduledScripts = [];

		this.refsMap = new Map();
		this.componentsMap = new Map();
		this.groupsMap = new Map();

		this.EntManager = new EntManager(
			componentsConstructor,
			() => this.componentsMap,
			() => this.refsMap,
			() => this.groupsMap,
		);
	}

	public EntManager: EntManager;

	public addScript = (scriptConstructor: ScriptConstructor<EntScript>): void => {
		const script = new scriptConstructor(),
			refList = [],
			componentIndexList = [];
		let queryMask = 0;
		for (const compoentName of script.argsType) {
			queryMask |= this.componentsMap.get(compoentName)!.mask;
			refList.push(this.refsMap.get(compoentName) as Reference<EntComponentTypes>);
			componentIndexList.push(this.componentsMap.get(compoentName)!.index);
		}

		this.scriptMap.set(scriptConstructor.name, { queryMask, script, refList, componentIndexList });
	}

	// public enableScript(name: string): void;
	// public desableScript(name: string): void;

	public schedule = (scriptOrder: string[]): void => {
		this.scheduledScripts.length = 0;
		for (const scriptName of scriptOrder) {
			const script = this.scriptMap.get(scriptName) as ScriptMapProps;
			this.scheduledScripts.push(script);
		}
	}

	public execute = (): void => {
		const scriptArgs = [];

		for (const scriptData of this.scheduledScripts) {
			const groupIterator = this.groupsMap.values();
			for (const group of groupIterator) {
				if ((group.mask & scriptData.queryMask) !== scriptData.queryMask) continue;

				const iterationData = group.getIterationData(scriptData.componentIndexList);
				// for chunks in group
				for (const { view, sectionCount, sectionSize } of iterationData.chunkViews) {
					// for sections in chunk
					for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex++) {
						// for components in section
						for (let i = 0; i < iterationData.componentSectionOffset.length; i++) {
							const ref = scriptData.refList[i];
							ref.updateView(view, sectionIndex * sectionSize + iterationData.componentSectionOffset[i]);
							scriptArgs.push(ref.get());
						}
						scriptData.script.forEachEntity(...scriptArgs as never[]);
						scriptArgs.length = 0;
					}
				}
			}
		}
	}


	// public serializeStructuralDiff(): unknown;
	// public serializeData(): unknown;


	////////////////////////////////////////////////////////////
	// private /////////////////////////////////////////////////

	// Script:
	private scriptMap: Map<string, ScriptMapProps>;
	private scheduledScripts: ScriptMapProps[];

	// EntManager data:
	private refsMap: Map<string, Reference<EntComponentTypes>>;
	private componentsMap: Map<string, ComponentMapProps>;
	private groupsMap: Map<number, Group>;



	////////////////////////////////////////////////////////////
	// static //////////////////////////////////////////////////

	// public static deserializeStructuralDiff(): unknown;
	// public static deserializeData(): unknown;

	// public static addScript(script: EntScript): string;
	// public static executeScript(name: string): void;
}


export default World;
