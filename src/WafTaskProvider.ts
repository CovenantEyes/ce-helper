import * as vscode from 'vscode';
import * as _ from 'lodash';

import nodeToTask from './TaskGeneration';
import { WorkspaceAttributes } from './WorkspaceDiscovery';

export default class WafTaskProvider implements vscode.TaskProvider {
    readonly tasks: vscode.Task[];
    constructor(attributes: WorkspaceAttributes) {
        this.tasks = [];

        this.resolveWafTasks(attributes);
    }

    provideTasks(token?: vscode.CancellationToken): vscode.ProviderResult<vscode.Task[]> {
        return this.tasks;
    }

    resolveTask(task: vscode.Task, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.Task> {
        // This provider does not resolve any user-defined tasks, and tasks
        // returned via provideTasks are already fully resolved.
        return undefined;
    }

    resolveWafTasks(attributes: WorkspaceAttributes): void {
        if (!attributes.wafCommands || !attributes.paths.wafPath) {
            return;
        }

        for (const wafNode of attributes.wafCommands) {
            const task = nodeToTask(wafNode, attributes);
            if (task) {
                this.tasks.push(task);
            }
        }
    }
}
