import * as fs_root from 'fs';

const fs = fs_root.promises;

async function stat(path: string): Promise<fs_root.Stats | undefined> {
    try {
        return await fs.stat(path);
    } catch {
        return undefined;
    }
}

export async function folderExists(path: string): Promise<boolean> {
    const stats = await stat(path);
    return stats ? stats.isDirectory() : false;
}

export async function fileExists(path: string): Promise<boolean> {
    const stats = await stat(path);
    return stats ? stats.isFile() : false;
}
