import * as vscode from 'vscode';

import { Node, NodeType } from './TreeData';
import { WorkspaceAttributes } from './WorkspaceDiscovery';
import { getIconPair, IconPath } from './VSCodeUtils';

class GroupHeader extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly iconPath: IconPath
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
    }
}

class BasicZarfTreeFolder extends vscode.TreeItem {
    public children: Node[];

    constructor(public readonly label: string) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.children = [];
    }
}

class BasicZarfTerminus extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly iconPath: IconPath,
        public readonly command?: vscode.Command
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
    }
}

class ZarfModule extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly iconPath: IconPath,
        public readonly hasChildren: boolean,
        public readonly command: vscode.Command,
    ) {
        super(label, hasChildren ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
    }
}

export default class BasicZarfTree implements vscode.TreeDataProvider<Node> {
    protected nodes: Node[];

    constructor(workspaceAttributes: WorkspaceAttributes) {
        this.nodes = [];

        if (workspaceAttributes.zarfNodes) {
            const zarfModules = new Node('Zarf Modules', 'All Zarf modules in this workspace', NodeType.ZARF_GROUP_HEADER);
            zarfModules.children = workspaceAttributes.zarfNodes;
            this.nodes.push(zarfModules);
        }

        if (workspaceAttributes.wafCommands) {
            const wafComamnds = new Node('Waf Commands', 'All available waf commands', NodeType.WAF_GROUP_HEADER);
            wafComamnds.children = workspaceAttributes.wafCommands;
            this.nodes.push(wafComamnds);
        }

        if (workspaceAttributes.npmNodes) {
            const npmProjects = new Node('NPM Projects', 'All NPM projects in this workspace', NodeType.NPM_GROUP_HEADER);
            npmProjects.children = workspaceAttributes.npmNodes;
            this.nodes.push(npmProjects);
        }
    }

    public getTreeItem(element: Node): vscode.TreeItem | Thenable<vscode.TreeItem> {
        switch(element.type) {
            case NodeType.ZARF_GROUP_HEADER:
                return new GroupHeader(element.name, element.description, '');
            case NodeType.WAF_GROUP_HEADER:
                return new GroupHeader(element.name, element.description, '');
            case NodeType.NPM_GROUP_HEADER:
                return new GroupHeader(element.name, element.description, '');
            case NodeType.NPM_COMMAND:
                return new BasicZarfTerminus(
                    element.name,
                    element.description,
                    getIconPair('wnpm.svg'),
                    {
                        title: 'execute',
                        command: 'npmCommands.runNPMCommand',
                        arguments: [ element ],
                    }
                );
            case NodeType.WAF_COMMAND:
                return new BasicZarfTerminus(
                    element.name,
                    element.description,
                    getIconPair('waf.svg'),
                    {
                        title: 'execute',
                        command: 'wafCommands.runWafCommand',
                        arguments: [ element ],
                    }
                );
            case NodeType.ZARF_MODULE:
                return new ZarfModule(
                    element.name,
                    element.description,
                    getIconPair('zarf.svg'),
                    element.children.length > 0,
                    {
                        title: 'build',
                        command: 'zarfModules.buildZarfModule',
                        arguments: [ element ],
                    }
                );
            case NodeType.SPACER:
                return new BasicZarfTerminus(element.name, element.description, '');
            default:
                return new BasicZarfTreeFolder(element.name);
        }
    }

    public getChildren(element?: Node | undefined): vscode.ProviderResult<Node[]> {
        return element ? element.children : this.nodes;
    }
}
