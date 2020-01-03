import * as vscode from 'vscode';

import { Node, NodeType } from './TreeData';
import { WorkspaceAttributes } from './WorkspaceDiscovery';

export default function nodeToTask(node: Node, attributes: WorkspaceAttributes): vscode.Task | undefined {
    switch(node.type) {
        case NodeType.WAF_COMMAND:
            return attributes.paths.wafPath ? new vscode.Task(
                { type: 'waf', command: node.name },
                vscode.TaskScope.Workspace,
                node.name,
                'waf',
                // Specifying python expicitly for windows compatibility (same for other tasks)
                new vscode.ProcessExecution('python', [ attributes.paths.wafPath, node.name ])
            ) : undefined;
        case NodeType.NPM_COMMAND:
            return attributes.paths.wafexecPath ? new vscode.Task(
                { type: 'wafexec'},
                vscode.TaskScope.Workspace,
                `${node.projectName}/${node.name}`,
                'wnpm',
                new vscode.ProcessExecution(
                    'python',
                    [ attributes.paths.wafexecPath, 'npm', 'run', node.name ],
                    { cwd: node.commandPath }
                )
            ) : undefined;
        case NodeType.ZARF_MODULE:
            return attributes.paths.wafPath ? new vscode.Task(
                { type: 'zarf'},
                vscode.TaskScope.Workspace,
                `build ${node.projectName}`,
                'zarf',
                new vscode.ProcessExecution(
                    'python',
                    [ attributes.paths.wafPath ],
                    { cwd: node.commandPath }
                )
            ) : undefined;
    }

    return undefined;
}
