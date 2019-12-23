import * as vscode from 'vscode';

import BasicZarfTree from './BasicZarfTree';
import CommandExecutor from './CommandExecutor';
import StatusActionTree from './StatusActionTree';
import { setContext } from './VSCodeUtils';
import { discoverWorkspace, ProjectType } from './WorkspaceDiscovery';
import { registerCommand, setTreeDatasource } from './VSCodeUtils';

let toDisposeOnContextSwitch: vscode.Disposable[] | undefined;

const executor = new CommandExecutor();

async function setUpUI() {
    if (toDisposeOnContextSwitch) {
        toDisposeOnContextSwitch.forEach(x => x.dispose());
        toDisposeOnContextSwitch = undefined;
    }

    const scanningScreen = setTreeDatasource(new StatusActionTree());

    const attributes = await discoverWorkspace();

    scanningScreen.dispose();

    switch(attributes.type) {
        case ProjectType.NO_FOLDER:
        case ProjectType.MULTI_FOLDERS:
        case ProjectType.NON_CE:
        case ProjectType.ZARF_NOT_CLONED:
        case ProjectType.ZARF_SUBMODULE_NOT_INITIALIZED:
            toDisposeOnContextSwitch = [
                setTreeDatasource(new StatusActionTree(attributes))
            ];
            return;
        case ProjectType.SCAFFOLDER_TYPESCRIPT_EXPRESS:
        case ProjectType.ZARF_GENERIC:

            toDisposeOnContextSwitch = [
                setTreeDatasource(new BasicZarfTree(attributes))
            ];
    }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    setContext('ceExtensionIsActive', true);

    registerCommand(context, 'zarfModules.buildZarfModule', args => executor.buildZarfModule(args));
    registerCommand(context, 'wafCommands.runWafCommand', args => executor.executeWafCommand(args));
    registerCommand(context, 'npmCommands.runNPMCommand', args => executor.executeNPMCommand(args));
    registerCommand(context, 'ceHelper.exitOngoingProcess', () => executor.cancelProcess());

    registerCommand(context, 'ceHelper.getSubmodules', async () => {
        executor.getSubmodules();
        await executor.awaitIdle();
        await setUpUI();
    });

    registerCommand(context, 'ceHelper.cloneRepository', async args => {
        executor.cloneRepository(args);
        await executor.awaitIdle();
        await setUpUI();
    });

    registerCommand(context, 'ceHelper.refreshUI', async () => await setUpUI());

    await setUpUI();
}

export async function deactivate() {
    if (toDisposeOnContextSwitch) {
        toDisposeOnContextSwitch.forEach(x => x.dispose());
        toDisposeOnContextSwitch = undefined;
    }

    await executor.shutdown();
}
