import { ipcMain } from 'electron';
import { spawn } from 'child_process'

export function startCaptureProcessAudio(exePath, window) {
    let isCapturing = false;
    const cpaProcess = spawn(exePath, { detached: false });

    cpaProcess.stdout.on('data', (data) => {
        if (window.isDestroyed()) {
            return;
        }
        if (isCapturing) {
            // Forward raw PCM data directly
            // console.log(`[captureProcess] Forwarding PCM data, size: ${data.length}`);
            window.webContents.send('pcm-data', data);
            return;
        }

        try {
            const json = JSON.parse(data.toString());
            if (json.type === 'audio-sessions') {
                console.log('audio-sessions', json.data);
                window.webContents.send('audio-sessions', json.data);
            } else if (json.type === 'capture-format') {
                console.log('capture-format', json.data);
                isCapturing = true;
                window.webContents.send('capture-format', json.data);
            } else if (json.type === 'capture-stopped') {
                console.log('Capture stopped.');
                isCapturing = false;
                window.webContents.send('capture-stopped');
            } else if (json.type === 'error') {
                console.log('error:', json);
                window.webContents.send('cpa-error', json);
            }
        } catch (e) {
            // Errors during the JSON phase are logged, but we don't switch mode.
            console.log('parse json error:', e, '\noriginal data:', data.toString());
        }
    });

    cpaProcess.stderr.on('data', (data) => {
        console.log('stderr:', data.toString());
    });

    cpaProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    ipcMain.on('get-audio-sessions', () => {
        const input = JSON.stringify({
            type: 'get-audio-sessions',
        })
        cpaProcess.stdin.write(input + '\n');
    });

    ipcMain.on('start-capture', (event, pid) => {
        if (typeof pid !== 'number') {
            pid = parseInt(pid, 10);
        }
        const input = JSON.stringify({
            type: 'start-capture',
            pid: pid,
        })
        console.log('start-capture command:', input);
        cpaProcess.stdin.write(input + '\n');
    });

    ipcMain.on('stop-capture', () => {
        isCapturing = false;
        const input = JSON.stringify({
            type: 'stop-capture',
        })
        cpaProcess.stdin.write(input + '\n');
    });

    const quitCpaProcess = () => {
        if (cpaProcess && !cpaProcess.killed) {
            console.log('Sending stop-capture command...');
            const command = { type: 'stop-capture' };
            cpaProcess.stdin.write(JSON.stringify(command) + '\n');
            setTimeout(() => {
                if (!cpaProcess.killed) {
                    cpaProcess.kill();
                }
            }, 200);
        } else {
            console.log('CPA process not running, cannot stop capture.');
        }
    }

    return quitCpaProcess;
}
