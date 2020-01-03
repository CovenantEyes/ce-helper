import * as vscode from 'vscode';

import nodeToTask from './TaskGeneration';
import { Node, NodeType } from './TreeData';
import { setContext, singularBasePath } from './VSCodeUtils';
import { getWafArgsIfRelevant } from './WafUtil';
import { WorkspaceAttributes } from './WorkspaceDiscovery';

interface ActiveTask {
    readonly task: vscode.TaskExecution;
    readonly completionPromise: Promise<void>;
}

export default class CommandExecutor {
    private activeTask?: ActiveTask;
    resolveCompletion?: () => void;

    constructor() {
        vscode.tasks.onDidEndTask(e => {
            if (
                this.activeTask
                && this.resolveCompletion
                && e.execution.task === this.activeTask.task.task
            ) {
                this.resolveCompletion();
            }
        });
    }

    public async launchNodeCommand(node: Node, attributes?: WorkspaceAttributes) {
        if (!attributes) {
            return;
        }

        const task = nodeToTask(node, attributes);
        if (!task) {
            return;
        }

        const execution = task.execution as vscode.ProcessExecution;

        if (execution && node.type === NodeType.WAF_COMMAND) {
            const extraArgs = await getWafArgsIfRelevant(node.name);
            extraArgs.forEach(x => execution.args.push(x));
        }

        this.launchSerialTask(task);
    }

    public async getSubmodules(): Promise<void> {
        const maybeRoot = singularBasePath();
        if (maybeRoot) {
            await this.launchSerialTask(new vscode.Task(
                { type: 'git '},
                vscode.TaskScope.Global,
                'update submodules',
                'git',
                new vscode.ProcessExecution(
                    'git',
                    [ 'submodule', 'update', '--init' ],
                    { cwd: maybeRoot }
                )
            ));
        }
    }

    public async cloneRepository(args: string[]): Promise<void> {
        const [ repoUrl, tag ] = args;
        const maybeRoot = singularBasePath();
        if (maybeRoot) {
            await this.launchSerialTask(new vscode.Task(
                { type: 'git '},
                vscode.TaskScope.Global,
                'update submodules',
                'git',
                new vscode.ProcessExecution(
                    'git',
                    [ 'clone', '--branch', tag, repoUrl ],
                    { cwd: maybeRoot }
                )
            ));
        }
    }

    public async cancelProcess(): Promise<void> {
        if (this.activeTask) {
            this.activeTask.task.terminate();
        }
    }

    public async awaitIdle(): Promise<void> {
        if (this.activeTask) {
            await this.activeTask.completionPromise;
        }
    }

    public async shutdown(): Promise<void> {
        await this.cancelProcess();
        await this.awaitIdle();
    }

    private async launchSerialTask(task: vscode.Task): Promise<void> {
        if (this.activeTask) {
            vscode.window.showErrorMessage('Parallel CE tasks not supported!');
            return;
        }

        setContext('ceCommandActive', true);

        const execution = await vscode.tasks.executeTask(task);
        const completionPromise = new Promise<void>(resolve => {
            this.resolveCompletion = resolve;
        });

        this.activeTask = {
            task: execution,
            completionPromise,
        };

        await completionPromise;

        this.activeTask = undefined;

        setContext('ceCommandActive', false);
    }
}
