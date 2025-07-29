import { ipcMain } from 'electron';
import { getEnvConfig, setEnvConfig } from '../config/env-handler.mjs';
import { startTurnTailscaleProcess } from '../subprocess/start-turn-tailscale.mjs';
import { getExecutablePath } from '../utils/get-exe-path.mjs';

export const registerIpcHandler = () => {
    // async request TURN info
    ipcMain.handle('request-TURN-info', async () => {
        return global.TURNinfo;
    })

    // env config read & write
    ipcMain.handle('get-env-config', () => {
        return getEnvConfig();
    })

    ipcMain.on('set-env-config', (event, config) => {
        setEnvConfig(config);
    })

    // restart turn-on-tailscale
    ipcMain.on('restart-turn-on-tailscale', async () => {
        try {
            if (global.quitTurnTsProcess) {
                global.quitTurnTsProcess();
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log(chalk.yellow('restarting turn-on-tailscale'));
            global.quitTurnTsProcess = startTurnTailscaleProcess(
                getExecutablePath('turn-on-tailscale.exe'),
                global.mainWindow
            );
            
        } catch (error) {
            console.error(chalk.red('restart turn-on-tailscale failed:'), error);
        }
    })
}