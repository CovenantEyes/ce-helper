import * as vscode from 'vscode';

import { ProjectType, WorkspaceAttributes } from './WorkspaceDiscovery';
import { getIconPair, IconPath } from './VSCodeUtils';
import { getZarfTagFromWscript, promptUserToGetZarf, ZarfRepoUrl } from './ZarfUtils';

class ActionableStatusItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly iconPath: IconPath,
        public readonly command?: vscode.Command
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
    }
}

function newStatusOnlyItem(label: string) {
    return new ActionableStatusItem(label, '');
}

export default class StatusActionTree implements vscode.TreeDataProvider<ActionableStatusItem> {
    private nodes: ActionableStatusItem[];
    private initPromise: Promise<void>;

    constructor(attributes?: WorkspaceAttributes) {
        this.nodes = [];
        this.initPromise = this.init(attributes);
    }

    public getTreeItem(element: ActionableStatusItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public getChildren(element?: ActionableStatusItem | undefined): vscode.ProviderResult<ActionableStatusItem[]> {
        return this.initPromise.then(() => element ? [] : this.nodes );
    }

    private async init(attributes?: WorkspaceAttributes): Promise<void> {
        if (!attributes) {
            this.nodes.push(newStatusOnlyItem('Scanning...'));
            return;
        }

        switch(attributes.type) {
            case ProjectType.NO_FOLDER:
                this.nodes.push(newStatusOnlyItem('Open a workspace to use this extension.'));
                break;
            case ProjectType.MULTI_FOLDERS:
                this.nodes.push(newStatusOnlyItem('Only single-folder workspaces are supported.'));
                break;
            case ProjectType.NON_CE:
                this.nodes.push(newStatusOnlyItem('This does not appear to be a Covenant Eyes project.'));
                break;
            case ProjectType.ZARF_NOT_CLONED:
                await this.onMissingZarf(attributes, false);
                break;
            case ProjectType.ZARF_SUBMODULE_NOT_INITIALIZED:
                this.nodes.push(newStatusOnlyItem('Initialize submodules to continue.'));
                await this.onMissingZarf(attributes, true);
                break;
            default:
                return;
        }
    }

    private async onMissingZarf(attributes: WorkspaceAttributes, isSubmodule: boolean): Promise<void> {
        let cloneTag: string | undefined;
        if (!isSubmodule) {
            this.nodes.push(newStatusOnlyItem('Clone Zarf to continue.'));
            if (attributes.paths.wscriptPath) {
                cloneTag = await getZarfTagFromWscript(attributes.paths.wscriptPath);
                this.nodes.push(new ActionableStatusItem(
                    `Clone Zarf (${cloneTag})`,
                    getIconPair('git.svg'),
                    {
                        title: 'Clone Zarf',
                        command: 'ceHelper.cloneRepository',
                        arguments: [
                            [ ZarfRepoUrl, cloneTag ],
                        ],
                    }
                ));
            }
        } else {
            this.nodes.push(new ActionableStatusItem(
                'Init Submodules',
                getIconPair('git.svg'),
                {
                    title: 'Init Submodules',
                    command: 'ceHelper.getSubmodules',
                    arguments: [ ],
                }
            ));
        }

        // Intentionally not awaiting this because we don't want the dialog to block remaining initialization.
        promptUserToGetZarf(cloneTag);
    }
}
