import * as vscode from 'vscode';
import { join } from 'path';
import * as fs_root from 'fs';

import * as shell from './ShellUtils';
import { Node, NodeType } from './TreeData';

const fs = fs_root.promises;

export const ZarfRepoUrl = 'git@github.com:CovenantEyes/zarf.git';

export async function getZarfModules(basePath: string): Promise<Node[]> {
    // IMPROVE: Using the shell for this is gross but easy.
    const lines = (await shell.exec(['find', basePath, '-name', 'wscript_build']))[0].split('\n');

    const dirTree = new Node('.', '', NodeType.ZARF_MODULE);

    for (const line of lines) {
        if (line.includes('/zarf/') || line.includes('.icebox') || line === '') {
            continue;
        }

        const adjusted = line.replace(basePath, '.');
        const segments = adjusted.split('/').filter(s => s !== '.' && s !== 'wscript_build');

        let node = dirTree;

        const modulePath: string[] = [];

        let fqProjectName = '';
        for (const segment of segments) {
            fqProjectName = join(fqProjectName, segment);
            modulePath.push(segment);
            if (!node.children.some(child => child.name === segment)) {
                const newNode = new Node(
                    segment,
                    `Build ${segment}`,
                    NodeType.ZARF_MODULE,
                    join(basePath, ...modulePath),
                    fqProjectName
                );

                node.children.push(newNode);
                node = newNode;
            } else {
                node = node.children.filter(x => x.name === segment)[0];
            }
        }
    }

    return dirTree.children;
}

const tagRegex = /('|")repo('|").*?git@github\.com:CovenantEyes\/zarf\.git.*?('|")tag('|").*?('|")(?<tag>.*?)('|")/s;

/**
 * Gets the desired zarf tag based on the wscript.
 * Note: Does not do anything with git submodules. Only returns the tag from the icebox or 'master' if unspecfied.
 *
 * @param wscriptPath the path to the wscript file
 */
export async function getZarfTagFromWscript(wscriptPath: string): Promise<string> {
    const wscriptContent = (await fs.readFile(wscriptPath)).toString();

    const match = wscriptContent.match(tagRegex);
    if (match && match.groups && match.groups.tag) {
       return match.groups.tag;
    }

    return 'master';
}

export async function promptUserToGetZarf(cloneTag?: string): Promise<void> {
    interface ShouldGetNowChoice {
        title: string;
        getNow: boolean;
    }

    const choice = await vscode.window.showInformationMessage<ShouldGetNowChoice>(
        cloneTag !== undefined ?
            `This repository requires Zarf@${cloneTag}. Would you like to clone it?` :
            'It looks like you are missing the Zarf submodule. Would you like to update submodules?',
        {
            title: 'Yes',
            getNow: true,
        },
        {
            title: 'No',
            getNow: false,
        },
    );

    if (choice && choice.getNow) {
        if (cloneTag) {
            vscode.commands.executeCommand('ceHelper.cloneRepository', [ ZarfRepoUrl, cloneTag ]);
        } else {
            vscode.commands.executeCommand('ceHelper.getSubmodules');
        }
    }
}
