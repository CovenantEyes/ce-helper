import * as vscode from 'vscode';
import * as _ from 'lodash';

import { newSpacerNode, Node, NodeType } from './TreeData';
import { WorkspaceAttributes } from './WorkspaceDiscovery';
import { getIconPair, IconPath } from './VSCodeUtils';

import BasicZarfTree from './BasicZarfTree';

export default class NPMProjectTree extends BasicZarfTree {
    constructor(workspaceAttributes: WorkspaceAttributes) {
        super(workspaceAttributes);

        this.bubbleUpWafCommands();
        this.bubbleUpNPMCommands(workspaceAttributes);
    }

    bubbleUpNPMCommands(workspaceAttributes: WorkspaceAttributes) {
        // IMPROVE
        // We shouldn't even be in this class if there is no scaffolder config
        // This is probably a sign that the workspace attributes is poorly
        // designed. Good enough for a hackathon, I suppose!
        if (!workspaceAttributes.scaffolderConfig) {
            console.warn('Created NPMProjectTree without a scaffolder config.');
            return;
        }

        // This tree variant adds a few common tasks to the top level for the
        // scaffolder project being edited, so the developer need not dig
        // through the tree.
        const serviceName = workspaceAttributes.scaffolderConfig.options.service_name;

        // Assume that the service we're working on is at the top level of the NPM project tree.
        const npmProjects = _.find(this.nodes, x => x.type === NodeType.NPM_GROUP_HEADER);
        if (!npmProjects) {
            console.warn('Created NPMProjectTree without an NPM Projects tree.');
            return;
        }

        const projectNode = _.find(npmProjects.children, x => x.name === serviceName);
        if (!projectNode) {
            console.warn(`${serviceName} NPM project not found.`);
            return;
        }

        this.insertCommandGroup(projectNode, [
            'start:watch',
            'test',
            'lint:check',
            'build',
        ]);
    }

    bubbleUpWafCommands() {
        const wafCommands = _.find(this.nodes, x => x.type === NodeType.WAF_GROUP_HEADER);
        if (!wafCommands) {
            return;
        }

        this.insertCommandGroup(wafCommands, [
            'build',
            'configure',
            'clean',
        ]);
    }

    insertCommandGroup(baseNode: Node, commandList: string[]) {
        const bubbledNodes: Node[] = [];
        for (const commandName of commandList) {
            const command = _.find(baseNode.children, x => x.name === commandName);
            if (!command) {
                continue;
            }

            bubbledNodes.push(command);
        }

        bubbledNodes.push(newSpacerNode());

        this.nodes = bubbledNodes.concat(this.nodes);
    }
}
