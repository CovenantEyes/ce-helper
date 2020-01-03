import * as fs_root from 'fs';
import { join } from 'path';
import * as shell from './ShellUtils';

const fs = fs_root.promises;

import { Node, NodeType } from './TreeData';

/**
 * This is a subset of properties from the scaffolder config that are useful to
 * this extension.
 */
export interface ScaffolderConfig {
    readonly options: {
        readonly scaffolder_version: string;
        readonly template: string;
        readonly service_name: string;
    };
}

export async function getNPMNodes(basePath: string): Promise<Node[] | undefined> {
    // IMPROVE: Using the shell for this is gross but easy.
    const lines = (await shell.exec(
        ['find', basePath, '-name', 'package.json', '-not', '-path', '"**/node_modules/*"']
    ))[0].split('\n');

    const dirTree = new Node('.', '', NodeType.NPM_FOLDER);

    for (const packageFile of lines) {
        if (packageFile.includes('.icebox') || packageFile === '') {
            continue;
        }

        const adjusted = packageFile.replace(basePath, '.');
        const segments = adjusted.split('/').filter(s => s !== '.' && s !== 'package.json');

        let node = dirTree;

        let projectName = '';
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            projectName = join(projectName, segment);
            const isLast = i === segments.length - 1;
            if (!node.children.some(child => child.name === segment)) {
                const newNode = new Node(segment, '', isLast ? NodeType.NPM_FOLDER : NodeType.NPM_PROJECT);

                node.children.push(newNode);
                node = newNode;
            } else {
                node = node.children.filter(x => x.name === segment)[0];
            }
        }

        const packageJSON = JSON.parse((await fs.readFile(packageFile)).toString());
        const scripts = packageJSON.scripts;
        for (const script in scripts) {
            node.children.push(new Node(
                script,
                `Run ${script} for ${projectName}`,
                NodeType.NPM_COMMAND,
                packageFile.replace('package.json', ''),
                projectName
            ));
        }
    }

    return dirTree.children.length > 0 ? dirTree.children : undefined;
}
