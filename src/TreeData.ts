export const enum NodeType {
    // Workspace item desciptors
    NPM_FOLDER,
    NPM_PROJECT,
    NPM_COMMAND,
    ZARF_MODULE,
    WAF_COMMAND,

    // Meant for grouping nodes in the view
    ZARF_GROUP_HEADER,
    WAF_GROUP_HEADER,
    NPM_GROUP_HEADER,

    // Meant to separate things for cleanliness
    SPACER,
}

export class Node {
    public readonly name: string;
    public readonly description: string;
    public readonly type: NodeType;
    public readonly commandPath?: string;
    public readonly projectName?: string;
    public children: Node[];

    constructor(name: string, description: string, type: NodeType, commandPath?: string, projectName?: string) {
        this.name = name;
        this.description = description;
        this.type = type;
        this.commandPath = commandPath;
        this.projectName = projectName;
        this.children = [];
    }
}

export function newSpacerNode(): Node {
    return new Node('', 'Nothing to see here.', NodeType.SPACER);
}
