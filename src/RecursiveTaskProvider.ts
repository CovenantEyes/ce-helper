import * as vscode from 'vscode';
import * as _ from 'lodash';

import nodeToTask from './TaskGeneration';
import { WorkspaceAttributes } from './WorkspaceDiscovery';
import { Node, NodeType } from './TreeData';

export default class RecursiveTaskProvider implements vscode.TaskProvider {
    readonly tasks: vscode.Task[];
    constructor(attributes: WorkspaceAttributes, forNPM: boolean) {
        this.tasks = [];

        if ((forNPM && !attributes.npmNodes) || (!forNPM && !attributes.zarfNodes)) {
            return;
        }

        const root = new Node('', '', forNPM ? NodeType.NPM_GROUP_HEADER : NodeType.ZARF_GROUP_HEADER);
        root.children = forNPM ? attributes.npmNodes! : attributes.zarfNodes!;

        this.resolveTasks(root, attributes);
    }

    provideTasks(token?: vscode.CancellationToken): vscode.ProviderResult<vscode.Task[]> {
        return this.tasks;
    }

    resolveTask(task: vscode.Task, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.Task> {
        // This provider does not resolve any user-defined tasks, and tasks
        // returned via provideTasks are already fully resolved.
        return undefined;
    }

    resolveTasks(node: Node, attributes: WorkspaceAttributes): void {
        const maybeTask = nodeToTask(node, attributes);
        if (maybeTask) {
            this.tasks.push(maybeTask);
        }

        for (const child of node.children) {
            this.resolveTasks(child, attributes);
        }
    }
}
