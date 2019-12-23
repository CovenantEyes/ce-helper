import * as path from 'path';
import * as vscode from 'vscode';

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
