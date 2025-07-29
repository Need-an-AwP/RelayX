import { join } from 'path';
import { BrowserWindow } from 'electron';
import __dirname from '../utils/app-dir-name.mjs';
import { setWindowBound } from './window-bounds.mjs';
import { devServerPort } from '../utils/args.mjs';

export const createWindow = (store) => {
    // create window options
    const windowOptions = {
        title: 'RelayX',
        width: 1400,//default value
        height: 800,//default value
        minWidth: 600,//default value
        minHeight: 500,//default value
        autoHideMenuBar: true,
        frame: false,
        webPreferences: {
            preload: join(__dirname, 'preload/preload.mjs'),
            spellcheck: false,
            nodeIntegration: true,
            contextIsolation: true,
        }
    };

    setWindowBound(windowOptions, store);

    mainWindow = new BrowserWindow(windowOptions);

    if (global.isDev) {
        mainWindow.loadURL(`http://localhost:${devServerPort}`);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'));
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    return mainWindow;
}

export const createWebRTCInternalsWindow = () => {
    if (global.webrtcInternalsWindow) {
        global.webrtcInternalsWindow.focus();
        return;
    }

    const webrtcInternalsWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'WebRTC Internals',
        autoHideMenuBar: true,
        webPreferences: {
            // Default webPreferences are usually fine for chrome:// URLs
        }
    });

    webrtcInternalsWindow.loadURL('chrome://webrtc-internals');

    webrtcInternalsWindow.on('closed', () => {
        webrtcInternalsWindow = null;
    });

    return webrtcInternalsWindow;
}