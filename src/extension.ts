import * as vscode from 'vscode';

import BasicZarfTree from './BasicZarfTree';
import CommandExecutor from './CommandExecutor';
import NPMProjectTree from './NPMProjectTree';
import RecursiveTaskProvider from './RecursiveTaskProvider';
import StatusActionTree from './StatusActionTree';
import WafTaskProvider from './WafTaskProvider';
import { discoverWorkspace, ProjectType, WorkspaceAttributes } from './WorkspaceDiscovery';
import { registerCommand, setContext, setTreeDatasource } from './VSCodeUtils';

let toDisposeOnContextSwitch: vscode.Disposable[] = [];

const executor = new CommandExecutor();
let currentAttributes: WorkspaceAttributes | undefined;

async function setUpUI() {
    toDisposeOnContextSwitch.forEach(x => x.dispose());
    toDisposeOnContextSwitch = [];
    currentAttributes = undefined;

    const scanningScreen = setTreeDatasource(new StatusActionTree());
    currentAttributes = await discoverWorkspace();

    scanningScreen.dispose();

    toDisposeOnContextSwitch = [
        vscode.tasks.registerTaskProvider('waf', new WafTaskProvider(currentAttributes)),
        vscode.tasks.registerTaskProvider('wafexec', new RecursiveTaskProvider(currentAttributes, true)),
        vscode.tasks.registerTaskProvider('zarf', new RecursiveTaskProvider(currentAttributes, false)),
    ];

    switch(currentAttributes.type) {
        case ProjectType.NO_FOLDER:
        case ProjectType.MULTI_FOLDERS:
        case ProjectType.NON_CE:
        case ProjectType.ZARF_NOT_CLONED:
        case ProjectType.ZARF_SUBMODULE_NOT_INITIALIZED:
            toDisposeOnContextSwitch.push(
                setTreeDatasource(new StatusActionTree(currentAttributes))
            );
            return;
        case ProjectType.SCAFFOLDER_TYPESCRIPT_EXPRESS:
            toDisposeOnContextSwitch.push(
                setTreeDatasource(new NPMProjectTree(currentAttributes))
            );
            return;
        case ProjectType.ZARF_GENERIC:
            toDisposeOnContextSwitch.push(
                setTreeDatasource(new BasicZarfTree(currentAttributes))
            );
            return;
    }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    setContext('ceExtensionIsActive', true);

    registerCommand(context, 'zarfModules.buildZarfModule', arg => executor.launchNodeCommand(arg, currentAttributes));
    registerCommand(context, 'wafCommands.runWafCommand', arg => executor.launchNodeCommand(arg, currentAttributes));
    registerCommand(context, 'npmCommands.runNPMCommand', arg => executor.launchNodeCommand(arg, currentAttributes));
    registerCommand(context, 'ceHelper.exitOngoingProcess', () => executor.cancelProcess());

    registerCommand(context, 'ceHelper.getSubmodules', async () => {
        await executor.getSubmodules();
        await setUpUI();
    });

    registerCommand(context, 'ceHelper.cloneRepository', async args => {
        await executor.cloneRepository(args);
        await setUpUI();
    });

    registerCommand(context, 'ceHelper.refreshUI', async () => await setUpUI());

    await setUpUI();
}

export async function deactivate() {
    toDisposeOnContextSwitch.forEach(x => x.dispose());
    toDisposeOnContextSwitch = [];

    await executor.shutdown();
}
