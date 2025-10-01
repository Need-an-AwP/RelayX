import { ipcMain } from 'electron';
import { spawn } from 'child_process'
import { resolveEnvFilePath } from '../config/env-handler.mjs';
import { exeDirPath } from '../utils/app-dir-name.mjs';
import { getExecutablePath } from '../utils/get-exe-path.mjs';
import chalk from 'chalk';
import { join } from 'path';


export const startTwgProcess = (window, store) => {
    const envFilePath = resolveEnvFilePath(); //prepare env file even if not using key login
    console.log('Resolved env file path:', envFilePath);
    global.showWelcome = false;// define global.showWelcome here

    if (store.get('loginMethod') === null) {
        console.log(chalk.red('twg won`t start due to no login method specified'));
        global.showWelcome = true;
        return () => { };
    }
    const args = [];

    if (store.get('loginMethod') === 'key') {
        if (envFilePath) {
            console.log(chalk.green('env file path:'), envFilePath);
            args.push(`--env=${envFilePath}`);
        } else {
            console.log(chalk.red('twg won`t start due to no env file'));
            global.showWelcome = { type: 'authkey' };
            return () => { };
        }
    } else if (store.get('loginMethod') === 'account') {
        console.log(chalk.green('using account login'));
        global.showWelcome = false;
    } else {
        console.log(chalk.red('twg won`t start due to unknown login method'));
        global.showWelcome = true;
        return () => { };
    }

    if (!process.env.DEV) {
        args.push(`--dirpath=${join(exeDirPath, 'tsNodeDir')}`);
    }


    const exePath = getExecutablePath('tailscale-webrtc-gateway.exe');
    console.log(chalk.blue('path of tailscale-webrtc-gateway.exe:'), exePath);
    const twgProcess = spawn(exePath, args, { detached: false });

    // 将进程实例存储到全局变量中，用于重启时检查状态
    global.twgProcess = twgProcess;

    // stdin forwarding
    const stdinTypes = ['dc', 'userState']
    stdinTypes.forEach(type => {
        ipcMain.on(type, (event, message) => {
            if (twgProcess && twgProcess.stdin) {
                twgProcess.stdin.write(JSON.stringify({ type: type, message: message }) + '\n');//message is object
            }
        })
    })

    // remove before create listeners to avoid duplication error
    ipcMain.removeHandler('getWsInfo');
    ipcMain.removeHandler('getTsBackendState');


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
                        case "tsAuthURL":
                            console.log(chalk.green('Backend TS Auth URL:'), jsonData);
                            break;
                        case "tsError":
                            console.log(chalk.red('Backend TS Error:'), jsonData);
                            window.webContents.send('tsError', jsonData);
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
        // 清理全局变量引用
        if (global.twgProcess === twgProcess) {
            global.twgProcess = null;
        }
    });

    const quitTwgProcess = () => {
        console.log('Stopping Go backend process...');
        twgProcess.kill('SIGTERM');

        setTimeout(() => {
            if (!twgProcess.killed) {
                console.log('Force killing Go backend process...');
                twgProcess.kill('SIGKILL');
            }
            // 清理全局变量引用
            if (global.twgProcess === twgProcess) {
                global.twgProcess = null;
            }
        }, 2000);
    }

    global.quitTwgProcess = quitTwgProcess;
    return quitTwgProcess;
}