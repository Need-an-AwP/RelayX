import Store from 'electron-store';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export function initConfigStore(configName) {
    const store = new Store({
        cwd: __dirname,
        name: configName,
        defaults: {
            userName: 'default user name',
            userAvatar: 'https://github.com/shadcn.png',
            userStatus: 'online',
            theme: 'dark',
            initAudioDevices: {
                input: 'default',
                output: 'default'
            },
            windowBounds: {
                width: 1200,
                height: 832
            }
        }
    });
    const userConfigKeys = ['userName', 'userAvatar', 'userStatus', 'theme', 'initAudioDevice'];
    console.log('Config file path:', store.path);

    return { store, userConfigKeys };
}