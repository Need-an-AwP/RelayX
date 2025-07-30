import { ipcMain } from 'electron';
import Store from 'electron-store';
import chalk from 'chalk';
import __dirname from '../utils/app-dir-name.mjs';
import { join, dirname } from 'path';

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
        width: 1400,
        height: 800
    }
}


export function initConfigStore(configName) {
    const store = new Store({
        cwd: process.env.DEV ? __dirname : dirname(dirname(__dirname)),// equals to process.resourcesPath but resourcepath has some problems
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

    return { store, userConfigKeys };
}