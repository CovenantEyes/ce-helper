import * as child_process from 'child_process';

export function exec(command: string[]): Promise<[string, string]> {
    return new Promise((resolve, reject) => {
        child_process.exec(command.join(' '), (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve([stdout, stderr]);
            }
        });
    });
}

export async function getChildren(pid: number): Promise<number[]> {
    try {
        const output = await exec([ 'pgrep', '-P', pid.toString() ]);
        return output[0].split('\n').filter(subPid => subPid && subPid !== '').map(subPid => Number(subPid));
    } catch (err) {
        // Error here usually means there are no children
        return [];
    }
}
