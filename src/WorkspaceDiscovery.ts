import * as vscode from 'vscode';
import * as fs_root from 'fs';
import * as path from 'path';

import { fileExists, folderExists } from './FileUtils';
import { Node } from './TreeData';
import { getNPMNodes, ScaffolderConfig } from './NPMUtils';
import { getWafCommands } from './WafUtil';
import { getZarfModules } from './ZarfUtils';

const fs = fs_root.promises;

export enum ProjectType {
    // Show option to open folder
    NO_FOLDER = 'NO_FOLDER',
    // Show error
    MULTI_FOLDERS = 'MULTI_FOLDERS',
    // Show error
    NON_CE = 'NON_CE',
    // Show option to clone zarf and refresh
    ZARF_NOT_CLONED = 'ZARF_NOT_CLONED',
    // Show option to get the zarf submodule
    ZARF_SUBMODULE_NOT_INITIALIZED = 'ZARF_SUBMODULE_NOT_INITIALIZED',
    // List out supported generic operations in treeview
    ZARF_GENERIC = 'ZARF_GENERIC',
    // Show IDE-esque view with buid/test helpers
    // ZARF_CXX = 'ZARF_CXX',
    // Show IDE-esque view with buid/test helpers
    SCAFFOLDER_TYPESCRIPT_EXPRESS = 'SCAFFOLDER_TYPESCRIPT_EXPRESS',
}

export interface PathInformation {
    readonly basePath?: string;
    readonly wscriptPath?: string;
    readonly zarfPath?: string;
    readonly wafPath?: string;
    readonly wafexecPath?: string;
}

export interface WorkspaceAttributes {
    readonly type: ProjectType;
    readonly paths: PathInformation;
    readonly npmNodes?: Node[];
    readonly wafCommands?: Node[];
    readonly zarfNodes?: Node[];
    readonly scaffolderConfig?: ScaffolderConfig;
}

export async function discoverWorkspace(): Promise<WorkspaceAttributes> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        return { type: ProjectType.NO_FOLDER, paths: { } };
    }

    if (folders.length > 1) {
        // IMPROVE: If opening multiple workspaces is popular at CE, refactor
        //          this to support it.
        return { type: ProjectType.MULTI_FOLDERS, paths: { } };
    }

    const basePath = folders[0].uri.fsPath;

    const wscriptPath = path.join(basePath, 'wscript');

    // IMPROVE: Add project types that are not zarf-based.
    if (!await fileExists(wscriptPath)) {
         return { type: ProjectType.NON_CE, paths: { wscriptPath } };
    }

    let zarfPath = path.join(basePath, 'zarf');
    if (!await folderExists(zarfPath)) {
        // If we're editing a project that is an icebox module, then we can use
        // zarf from the parent project's folder.
        const parentWscriptPath = path.join(basePath, '..', 'wscript');
        const parentZarfPath = path.join(basePath, '..', 'zarf');
        if (await fileExists(parentWscriptPath) && await folderExists(parentZarfPath)) {
            zarfPath = parentZarfPath;
        } else {
            return { type: ProjectType.ZARF_NOT_CLONED, paths: { wscriptPath } };
        }
    }

    const wafPath = path.join(zarfPath, 'waf');
    const wafexecPath = path.join(zarfPath, 'wafexec');
    if (!await fileExists(wafPath) || !await fileExists(wafexecPath)) {
        return { type: ProjectType.ZARF_SUBMODULE_NOT_INITIALIZED, paths: { wscriptPath } };
    }

    let projectType = ProjectType.ZARF_GENERIC;

    // Kick these off while we do more stuff.
    const npmNodesPromise = getNPMNodes(basePath);
    const zarfModulesPromise = getZarfModules(basePath);
    const wafCommandsPromise = getWafCommands(wafPath);

    const scaffolderJSONPath = path.join(basePath, '.scaffolder.json');
    let scaffolderConfig: ScaffolderConfig | undefined;
    if (await fileExists(scaffolderJSONPath)) {
        try {
            scaffolderConfig = JSON.parse((await fs.readFile(scaffolderJSONPath)).toString()) as ScaffolderConfig;

            if (scaffolderConfig.options.template === 'typescript_express') {
                projectType = ProjectType.SCAFFOLDER_TYPESCRIPT_EXPRESS;
            }
        } catch(err) {
            console.log(`Error reading scaffolder config. Defaulting to generic zarf project. ${err.message}`);
        }
    }

    return {
        type: projectType,
        paths: {
            basePath,
            wscriptPath,
            zarfPath,
            wafPath,
            wafexecPath,
        },
        npmNodes: await npmNodesPromise,
        wafCommands: await wafCommandsPromise,
        zarfNodes: await zarfModulesPromise,
        scaffolderConfig,
    };
}
