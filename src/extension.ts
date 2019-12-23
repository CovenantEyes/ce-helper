import * as vscode from 'vscode';

import BasicZarfTree from './BasicZarfTree';
import CommandExecutor from './CommandExecutor';
import { setContext } from './VSCodeUtils';
import { discoverWorkspace, ProjectType } from './WorkspaceDiscovery';

let toDisposeOnContextSwitch: vscode.Disposable[] | undefined;

const executor = new CommandExecutor();

async function setUpUI() {
    if (toDisposeOnContextSwitch) {
        toDisposeOnContextSwitch.forEach(x => x.dispose());
        toDisposeOnContextSwitch = undefined;
    }

    const attributes = await discoverWorkspace();
    switch(attributes.type) {
        case ProjectType.NO_FOLDER:
        case ProjectType.MULTI_FOLDERS:
        case ProjectType.NON_CE:
        case ProjectType.ZARF_NOT_CLONED:
        case ProjectType.ZARF_SUBMODULE_NOT_INITIALIZED:
            return;
        case ProjectType.SCAFFOLDER_TYPESCRIPT_EXPRESS:
        case ProjectType.ZARF_GENERIC:
            setContext('showGenericZarfTree', true);

            toDisposeOnContextSwitch = [
                vscode.window.registerTreeDataProvider('basicZarfTree', new BasicZarfTree(attributes))
            ];
    }
}

function registerCommand(
    context: vscode.ExtensionContext,
    command: string, callback: (...args: any[]) => any, thisArg?: any
) {
    context.subscriptions.push(vscode.commands.registerCommand(command, callback, thisArg));
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    await setUpUI();

    registerCommand(context, 'zarfModules.buildZarfModule', args => executor.buildZarfModule(args));
    registerCommand(context, 'wafCommands.runWafCommand', args => executor.executeWafCommand(args));
    registerCommand(context, 'npmCommands.runNPMCommand', args => executor.executeNPMCommand(args));
    registerCommand(context, 'ceHelper.exitOngoingProcess', () => executor.cancelProcess());
}

export async function deactivate() {
    if (toDisposeOnContextSwitch) {
        toDisposeOnContextSwitch.forEach(x => x.dispose());
        toDisposeOnContextSwitch = undefined;
    }

    await executor.shutdown();
}
