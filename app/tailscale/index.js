const dotenv = require('dotenv');
const path = require('path');
const koffi = require('koffi');
const generateUUID = require('../utils/uuid');
const getWindowsHostname = require('../utils/hostname');

class Tailscale {
    constructor() {
        this.isTailscaleAuthKey;
        this.uuid = generateUUID();
        this.hostName = getWindowsHostname();
        this.isDev = process.env.DEV !== undefined;
        this.envPath = this.isDev
            ? path.join(__dirname, '../../.env')
            : path.join(process.resourcesPath, '.env');
        this.dllPath = this.isDev
            ? path.join(__dirname, '../../tailscale-embed/tailscale-embed.dll')
            : path.join(process.resourcesPath, 'tailscale-embed.dll');
        this.getLocalClientStatus;
    }

    initialize(mainWindow) {
        dotenv.config({ path: this.envPath });

        const lib = koffi.load(this.dllPath);
        const startTailscale = lib.func('startTailscale', 'void', ['str', 'str', 'str', "..."]);
        this.getLocalClientStatus = lib.func('getLocalClientStatus', 'str', []);

        // register http callback
        const HTTPCallback = koffi.proto('void HTTPCallback(const char* from, const char* message)');
        const registerHTTPCallback = lib.func('RegisterHTTPCallback', 'void', [koffi.pointer(HTTPCallback)]);
        const httpHandler = koffi.register((from, message) => {
            console.log('http callback', from, message);
            mainWindow.webContents.send('http-server-message', {
                from: from,
                message: message,
            });
        }, koffi.pointer(HTTPCallback));
        registerHTTPCallback(httpHandler);

        // start go embedded tailscale and ws server
        const authKey = process.env.HEADSCALE_AUTH_KEY
        if (authKey.includes('tskey-auth-')) {
            this.isTailscaleAuthKey = true;
            startTailscale(authKey, this.hostName, this.uuid);
        } else {
            this.isTailscaleAuthKey = false;
            startTailscale(authKey, this.hostName, this.uuid, 'str', process.env.CONTROL_URL);
            // control url must be included when using headscale controller and authkey
        }
    }
}

const tailscale = new Tailscale();

module.exports = {
    tailscale,
    getUUID: () => {
        if (!tailscale) {
            console.error('tailscale is not initialized');
            return;
        }
        return tailscale.uuid
    },
    getIsTailscaleAuthKey: () => {
        if (!tailscale) {
            console.error('tailscale is not initialized');
            return;
        }
        return tailscale.isTailscaleAuthKey
    },
    getLocalClientStatus: () => {
        if (!tailscale) {
            console.error('tailscale is not initialized');
            return;
        }
        return tailscale.getLocalClientStatus
    }
}
