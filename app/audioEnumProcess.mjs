import { spawn } from 'child_process';

export function getAudioSessions(audioEnumProcessPath) {
    return new Promise((resolve, reject) => {
        const audioEnumProcess = spawn(audioEnumProcessPath);

        let stdout = '';
        audioEnumProcess.stdout.on('data', (data) => {
            stdout += data;
        });

        audioEnumProcess.stderr.on('data', (data) => {
            console.error(`AudioEnumProcess STDERR: ${data.toString()}`);
        });

        audioEnumProcess.on('close', (code) => {
            console.log(`AudioEnumProcess closed with code ${code}`);
            if (code === 0) {
                try {
                    const result = JSON.parse(stdout.toString());
                    resolve(result);
                } catch (e) {
                    console.error(`cannot parse AudioEnumProcess STDOUT: ${stdout.toString()}`);
                    reject(e);
                }
            } else {
                reject(new Error(`AudioEnumProcess exited with code ${code}`));
            }
        });

        audioEnumProcess.on('error', (err) => {
            reject(err);
        })
    });
}