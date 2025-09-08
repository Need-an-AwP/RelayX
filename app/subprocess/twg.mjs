import { ipcMain } from 'electron';
import { spawn } from 'child_process'
import { resolveEnvFilePath } from '../config/env-handler.mjs';
import { exeDirPath } from '../utils/app-dir-name.mjs';
import { getExecutablePath } from '../utils/get-exe-path.mjs';
import chalk from 'chalk';
import { join } from 'path';


export const startTwgProcess = (window) => {
    const envFilePath = resolveEnvFilePath(window);
    console.log(chalk.green('env file path:'), envFilePath);
    const args = [];
    if (!process.env.DEV) {
        args.push(`--dirpath=${join(exeDirPath, 'tsNodeDir')}`);
    }
    if (envFilePath) {
        args.push(`--env=${envFilePath}`);
    } else {
        console.log(chalk.red('twg won`t start due to no env file'));
        return () => { };
    }

    const exePath = getExecutablePath('tailscale-webrtc-gateway.exe');
    console.log(chalk.blue('path of tailscale-webrtc-gateway.exe:'), exePath);
    const twgProcess = spawn(exePath, args, { detached: false });

    // stdin
    const stdinTypes = ['dc', 'userState']

    stdinTypes.forEach(type => {
        ipcMain.on(type, (event, message) => {
            if (twgProcess && twgProcess.stdin) {
                twgProcess.stdin.write(JSON.stringify({ type: type, message: message }) + '\n');//message is object
            }
        })
    })


    let wsInfo = null;
    ipcMain.handle('getWsInfo', async () => {
        return wsInfo;
    });

    let tsBackendState = null;
    ipcMain.handle('getTsBackendState', async () => {
        return tsBackendState;
    });


    // stdout
    let outputBuffer = '';
    twgProcess.stdout.on('data', (data) => {
        outputBuffer += data.toString();
        const lines = outputBuffer.split('\n');
        outputBuffer = lines.pop() || ''; // 保留最后一行（可能不完整）

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            try {
                const jsonData = JSON.parse(trimmedLine);
                // console.log(chalk.green('Backend JSON:'), jsonData);
                const type = jsonData.type
                if (type) {
                    switch (type) {
                        case "ws":
                            // console.log(chalk.green('Backend WS Info:'), jsonData);
                            window.webContents.send('ws', jsonData);
                            wsInfo = jsonData;
                            break;
                        case "tsBackendState":// notified by watchipnbus
                            window.webContents.send('tsBackendState', jsonData);
                            tsBackendState = jsonData.state;
                            break;
                        case "tsStatus":// response every 1 second
                            window.webContents.send('tsStatus', jsonData);
                            break;
                    }
                }
            } catch (e) {
                console.log(chalk.yellow(`Failed to parse line: ${trimmedLine}`));
                console.log(chalk.red('Parse Error:'), e.message);
            }
        });

    });

    twgProcess.stderr.on('data', (data) => {
        console.error(`Backend STDERR: ${data.toString()}`);
    });

    twgProcess.on('error', (err) => {
        console.error('Failed to start Go backend process. Error:', err);
    });

    twgProcess.on('close', (code, signal) => {
        console.log(`Go backend process exited with code ${code} and signal ${signal}`);
    });

    const quitTwgProcess = () => {
        console.log('Stopping Go backend process...');
        twgProcess.kill('SIGTERM');

        setTimeout(() => {
            if (!twgProcess.killed) {
                console.log('Force killing Go backend process...');
                twgProcess.kill('SIGKILL');
            }
        }, 2000);
    }

    return quitTwgProcess;
}