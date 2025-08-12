import { ipcMain } from 'electron';
import { spawn } from 'child_process'
import { resolveEnvFilePath } from '../config/env-handler.mjs';
import { exePath } from '../utils/app-dir-name.mjs';
import chalk from 'chalk';
import { join } from 'path';

let askTailscaleStatusIntervalId

export const startTurnTailscaleProcess = (subExePath, window) => {
    const envFilePath = resolveEnvFilePath(window);
    console.log(chalk.green('env file path:'), envFilePath);
    const args = [];
    if (!process.env.DEV){
        args.push(`--dirpath=${join(exePath, 'tsNodeDir')}`);
    }
    if (envFilePath) {
        args.push(`--env=${envFilePath}`);
    } else {
        console.log(chalk.red('turn-on-tailscale won`t start due to no env file'));
        return () => { };
    }
    
    console.log(chalk.blue('path of turn-on-tailscale.exe:'), subExePath);
    const turnTsProcess = spawn(subExePath, args, { detached: false });

    turnTsProcess.stdout.on('data', (data) => {
        const messages = data.toString().trim().split('\n');
        messages.forEach(msgStr => {
            try {
                const message = JSON.parse(msgStr);
                switch (message.type) {
                    case "TURNinfo":
                        window.webContents.send('TURNinfo', message)
                        global.TURNinfo = message;
                        break;
                    case "onlinePeers":
                        window.webContents.send('onlinePeers', message)
                        break;
                    case "tailscaleInfo":
                        window.webContents.send('tailscaleInfo', message)
                        break;
                    case "accessibility":
                        window.webContents.send('accessibility', message)
                        break;
                    case "http/offer_ice":
                        window.webContents.send('http/offer_ice', message)
                        break;
                    case "http/answer_ice":
                        window.webContents.send('http/answer_ice', message)
                        break;
                }
            } catch (e) {
                // only print content which cannot be parsed as json
                // console.log(e)
                console.log(`Backend STDOUT: ${msgStr}`);
            }
        });
    });

    turnTsProcess.stderr.on('data', (data) => {
        console.error(`Backend STDERR: ${data.toString()}`);
    });

    turnTsProcess.on('error', (err) => {
        console.error('Failed to start Go backend process. Error:', err);
    });

    turnTsProcess.on('exit', (code, signal) => {
        console.log(`Go backend process exited with code ${code} and signal ${signal}`);
        if (askTailscaleStatusIntervalId) {
            clearInterval(askTailscaleStatusIntervalId);
        }
    });

    // Start polling client status
    if (turnTsProcess && turnTsProcess.stdin) {
        askTailscaleStatusIntervalId = setInterval(() => {
            if (turnTsProcess && turnTsProcess.stdin && !turnTsProcess.killed) {
                try {
                    turnTsProcess.stdin.write("client-status\n");
                } catch (error) {
                    console.error("Error writing to turnTsProcess stdin:", error);
                    clearInterval(askTailscaleStatusIntervalId);
                }
            } else {
                clearInterval(askTailscaleStatusIntervalId);
            }
        }, 5000);
    }

    // sdp forward
    ipcMain.on('offer', (event, message) => {
        if (turnTsProcess) {
            console.log('forwarding offer to go subprocess')
            turnTsProcess.stdin.write(message + '\n');
        }
    });

    ipcMain.on('answer', (event, message) => {
        if (turnTsProcess) {
            console.log('forwarding answer to go subprocess')
            turnTsProcess.stdin.write(message + '\n');
        }
    });

    const quitTurnTsProcess = () => {
        if (turnTsProcess && !turnTsProcess.killed) {
            console.log('Stopping TURN Tailscale process...');

            if (askTailscaleStatusIntervalId) {
                clearInterval(askTailscaleStatusIntervalId);
                askTailscaleStatusIntervalId = null;
            }

            setTimeout(() => {
                if (!turnTsProcess.killed) {
                    turnTsProcess.kill();
                }
            }, 200);
        } else {
            console.log('TURN Tailscale process not running, cannot stop.');
        }
    }

    return quitTurnTsProcess;
}