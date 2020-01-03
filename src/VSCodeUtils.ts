import * as path from 'path';
import * as vscode from 'vscode';

const CETreeID = 'ceTree';

// VSCode doesn't provide a nice alias for this. Based on the argument value for tree item icons.
export type IconPath =
    | string
    | vscode.Uri
    | { light: string | vscode.Uri; dark: string | vscode.Uri; }
    | vscode.ThemeIcon;

export function setContext(key: string, value: any) {
    vscode.commands.executeCommand('setContext', key, value);
}

export function getIconPath(name: string, isDark: boolean): string {
    return path.join(__filename, '..', '..', 'media', isDark ? 'dark': 'light', name);
}

export function getIconPair(name: string): { dark: string, light: string } {
    return {
        dark: getIconPath(name, true),
        light: getIconPath(name, false),
    };
}

export function registerCommand(
    context: vscode.ExtensionContext,
    command: string, callback: (...args: any[]) => any, thisArg?: any
) {
    context.subscriptions.push(vscode.commands.registerCommand(command, callback, thisArg));
}

export function setTreeDatasource<T>(treeDataProvider: vscode.TreeDataProvider<T>): vscode.Disposable {
    return vscode.window.registerTreeDataProvider(CETreeID, treeDataProvider);
}

export function singularBasePath(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        return undefined;
    }

    if (folders.length > 1) {
        return undefined;
    }

    return folders[0].uri.fsPath;
}
