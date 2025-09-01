import { ipcMain } from 'electron';
import Store from 'electron-store';
import chalk from 'chalk';
import { __dirname, exeDirPath } from '../utils/app-dir-name.mjs';

const defaultConfig = {
    userName: 'default user name',
    userAvatar: 'https://github.com/shadcn.png',
    userStatus: 'online',
    theme: 'dark',
    initAudioDevices: {
        input: 'default',
        output: 'default'
    },
    windowBounds: {
        width: 1400,//default value
        height: 800,//default value
        minWidth: 600,//default value
        minHeight: 500,//default value
    }
}


export function initConfigStore(configName) {
    const store = new Store({
        cwd: process.env.DEV ? __dirname : exeDirPath,// in dev, the path is app/, in portable, the path is the exePath
        name: configName,
        defaults: defaultConfig
    });

    const userConfigKeys = ['userName', 'userAvatar', 'userStatus', 'theme', 'initAudioDevice'];
    console.log(chalk.green('Config file path:'), store.path);

    // user config read & write
    ipcMain.handle('get-user-config', () => {
        return store.store;
    });

    ipcMain.on('set-user-config', (event, config, value) => {
        console.log('set-user-config', config, value);
        store.set(config, value);
    });

    return store;
}