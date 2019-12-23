import { join } from 'path';

import * as shell from './ShellUtils';
import { Node, NodeType } from './TreeData';

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

        for (const segment of segments) {
            modulePath.push(segment);
            if (!node.children.some(child => child.name === segment)) {
                const newNode = new Node(segment, '', NodeType.ZARF_MODULE, join(basePath, ...modulePath));

                node.children.push(newNode);
                node = newNode;
            } else {
                node = node.children.filter(x => x.name === segment)[0];
            }
        }
    }

    return dirTree.children;
}
