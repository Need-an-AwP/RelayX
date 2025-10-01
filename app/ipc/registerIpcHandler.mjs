import { ipcMain } from 'electron';
import { getEnvConfig, setEnvConfig } from '../config/env-handler.mjs';
import { startTwgProcess } from '../subprocess/twg.mjs';
import chalk from 'chalk';


export const registerIpcHandler = (mainWindow, store) => {
    // async request TURN info
    ipcMain.handle('request-TURN-info', async () => {
        return global.TURNinfo;
    })

    // env config read & write
    ipcMain.handle('get-env-config', () => {
        return getEnvConfig();
    })

    ipcMain.handle('show-welcome', () => {
        return global.showWelcome;
    })

    ipcMain.on('set-env-config', (event, config) => {
        setEnvConfig(config);
    })

    // restart turn-on-tailscale
    ipcMain.on('restart-twg', async () => {
        try {
            if (global.quitTwgProcess && global.twgProcess && !global.twgProcess.killed) {
                console.log(chalk.blue('Stopping existing TWG process...'));
                global.quitTwgProcess();
                await new Promise(resolve => setTimeout(resolve, 500));
            } else if (global.twgProcess && global.twgProcess.killed) {
                console.log(chalk.blue('TWG process already terminated, skipping quit step'));
            } else {
                console.log(chalk.blue('No existing TWG process found'));
            }

            console.log(chalk.yellow('restarting tailscale-webrtc-gateway...'));
            global.quitTurnTsProcess = startTwgProcess(mainWindow, store);

        } catch (error) {
            console.error(chalk.red('restart tailscale-webrtc-gateway failed:'), error);
        }
    })

    ipcMain.on('close-twg', () => {
        if (global.quitTwgProcess) {
            global.quitTwgProcess();
        }
    })
}