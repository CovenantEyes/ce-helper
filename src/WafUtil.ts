import * as vscode from 'vscode';

import * as shell from './ShellUtils';
import { Node, NodeType } from './TreeData';

export async function getWafCommands(wafPath: string): Promise<Node[]> {
    const rawOutput = await shell.exec([ wafPath, '--help' ]);
    const lines = rawOutput[0].replace(/\r/g, '').split('\n');
    let startIndex = 0;
    let endIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('Main commands')) {
            startIndex = i + 1; // +1 to get to the actual first line
        } else if (lines[i].startsWith('Options')) {
            endIndex = i - 1; // -1 to get back to the last line
            break;
        }
    }

    const commands: Node[] = [];
    for(let i = startIndex; i < endIndex; i++) {
        const match = lines[i].match(/^ *(?<name>.*?) *: *(?<tooltip>.*?)$/);
        if (!match || !match.groups) {
            continue;
        }

        commands.push(new Node(match.groups.name, match.groups.tooltip, NodeType.WAF_COMMAND));
    }

    return commands;
}

const CommandsThatMayNeedArgs = [
    'configure',
];

/** Prompts the user for additional arguments if the command is one that would
  * typically benefit from them.
  */
export async function getWafArgsIfRelevant(command: string): Promise<string[]> {
    if (!CommandsThatMayNeedArgs.includes(command)) {
        return [];
    }

    const extraArgs = await vscode.window.showInputBox({
        prompt: `Additional options for ${command} (optional):`,
        placeHolder: 'e.g. --debug',
    });

    return extraArgs ? extraArgs.split(' ') : [];
}
