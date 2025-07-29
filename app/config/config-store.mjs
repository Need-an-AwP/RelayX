import { ipcMain } from 'electron';
import Store from 'electron-store';
import chalk from 'chalk';
import __dirname from '../utils/app-dir-name.mjs';
import { existsSync } from 'fs';
import { join } from 'path';

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

const resolveConfigFileName = (configName) => {
    let cfgName;
    if (configName) {
        const configFilePath = join(__dirname, configName);
        if (!existsSync(configFilePath)) {
            console.log(chalk.yellow('invalid config file name, using default "user-config.json"'));
            cfgName = "user-config";
        } else {
            cfgName = configName;
        }
    } else {
        console.log(chalk.yellow('no config file name provided, using default "user-config.json"'));
        cfgName = "user-config";
    }
    return cfgName;
}

export function initConfigStore(configName) {
    // const cfgName = resolveConfigFileName(configName);

    const store = new Store({
        cwd: __dirname,
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