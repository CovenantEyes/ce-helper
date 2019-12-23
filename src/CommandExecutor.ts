import * as vscode from 'vscode';
import * as child_process from 'child_process';

import { setContext } from './VSCodeUtils';

interface ChildProcess {
    readonly process: child_process.ChildProcessWithoutNullStreams;
    readonly completionPromise: Promise<void>;
}

export default class CommandExecutor {
    private channel: vscode.OutputChannel;
    private activeProcess?: ChildProcess;

    constructor() {
        this.channel = vscode.window.createOutputChannel('CE Command Executor');
    }

    public executeWafCommand(args: string[]) {
        if (!vscode.workspace.rootPath) {
            return;
        }

        this.spawnCommand(vscode.workspace.rootPath, 'waf', args);
    }

    public executeNPMCommand(args: string[]) {
        const [ commandPath, npmCommand ] = args;
        this.spawnCommand(
            commandPath,
            'wafexec',
            [ 'npm', 'run', npmCommand ]
        );
    }

    public buildZarfModule(args: string[]) {
        const [ commandPath ] = args;
        this.spawnCommand(
            commandPath,
            'waf',
            [ ]
        );
    }

    public async cancelProcess(): Promise<void> {
        if (this.activeProcess) {
            // Waf and wafexec use exec() and execvpe() to spawn child processes, which is problematc for node's
            // child_process. Since we spawn our active process detached, we can use its negative pid to kill the
            // whole group.
            process.kill(this.activeProcess.process.pid * -1);
            this.channel.append('\n(process killed by user)\n');
        }
    }

    public async shutdown(): Promise<void> {
        if (!this.activeProcess) {
            return;
        }

        await this.cancelProcess();
        if (this.activeProcess) {
            await this.activeProcess.completionPromise;
        }
    }

    private async spawnCommand(cwd: string, executable: string, args: string[]): Promise<void> {
        if (this.activeProcess) {
            vscode.window.showErrorMessage('Parallel CE tasks not supported!');
            return;
        }

        setContext('ceCommandActive', true);

        this.channel.clear();
        this.channel.show(true);

        const write = (data: Buffer) => {
            this.channel.append(data.toString());
        };

        const process = child_process.spawn(executable, args, { cwd, detached: true });

        process.stdout.on('data', write);
        process.stderr.on('data', write);

        const completionPromise = new Promise<void>(resolve => {
            process.on('close', () => {
                resolve();
            });

            process.on('error', (err) => {
                vscode.window.showErrorMessage(`${err}`);
                resolve();
            });
        });

        this.activeProcess = { process, completionPromise };

        await completionPromise;

        this.channel.append('\n(done)\n');

        this.activeProcess = undefined;

        setContext('ceCommandActive', false);
    }
}
