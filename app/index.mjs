import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { getThrottledElectronProcessIds } from './electronPID.mjs';
import { getAvailableSources, setScreenCaptureId, setDisplayMediaRequestHandler } from './destopCapture.mjs';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import fs from 'fs';
import dotenv from 'dotenv';

import { join } from 'path';
import { spawn } from 'child_process';
const GOEXE = join(__dirname, 'turn-on-tailscale.exe');
let pionProcess;
let askTailscaleStatusIntervalId;
let TURNinfo;
let mainWindow;
let webrtcInternalsWindow;
let windowExtended = false;
// Parse command line arguments for port and hostname
let devServerPort = 5173; // Default port
let envFilePath = null;
let configName = 'user-config';


const isDev = process.env.DEV != undefined;
const args = process.argv.slice(isDev ? 2 : 1); // electron_path, app_path, then args OR app_path, then args
args.forEach(arg => {
    if (arg.startsWith('--port=')) {
        const portNum = parseInt(arg.split('=')[1]);
        if (!isNaN(portNum)) {
            devServerPort = portNum;
        }
    } else if (arg.startsWith('--env=')) {
        envFilePath = arg.split('=')[1];
    } else if (arg.startsWith('--config=')) {
        configName = arg.split('=')[1];
    }
});


import { initConfigStore } from './config-store.mjs';
const { store, userConfigKeys } = initConfigStore(configName);



// Function to start and manage the Go backend process
function startBackendProcess(window, envFilePath) {
    const args = [];
    if (envFilePath) {
        args.push(`--env=${envFilePath}`);
    }

    pionProcess = spawn(GOEXE, args, { detached: false });

    pionProcess.stdout.on('data', (data) => {
        const messages = data.toString().trim().split('\n');
        messages.forEach(msgStr => {
            try {
                const message = JSON.parse(msgStr);
                switch (message.type) {
                    case "TURNinfo":
                        window.webContents.send('TURNinfo', message)
                        TURNinfo = message;
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

    pionProcess.stderr.on('data', (data) => {
        console.error(`Backend STDERR: ${data.toString()}`);
    });

    pionProcess.on('error', (err) => {
        console.error('Failed to start Go backend process. Error:', err);
    });

    pionProcess.on('exit', (code, signal) => {
        console.log(`Go backend process exited with code ${code} and signal ${signal}`);
        if (askTailscaleStatusIntervalId) {
            clearInterval(askTailscaleStatusIntervalId);
        }
    });

    // Start polling client status
    if (pionProcess && pionProcess.stdin) {
        askTailscaleStatusIntervalId = setInterval(() => {
            if (pionProcess && pionProcess.stdin && !pionProcess.killed) {
                try {
                    pionProcess.stdin.write("client-status\n");
                } catch (error) {
                    console.error("Error writing to pionProcess stdin:", error);
                    clearInterval(askTailscaleStatusIntervalId);
                }
            } else {
                clearInterval(askTailscaleStatusIntervalId);
            }
        }, 5000);
    }
}

function handleBasicWindowAction(window) {
    ipcMain.on('minimize-window', () => {
        window.minimize();
    });
    ipcMain.on('maximize-window', () => {
        if (window.isMaximized()) {
            window.unmaximize();
        } else {
            window.maximize();
        }
    });
    ipcMain.on('close-window', () => {
        window.close();
    });

    ipcMain.on('resize-window', (event, wnh) => {
        const currentSize = window.getSize();
        const newWidth = wnh.width !== undefined ? wnh.width : currentSize[0];
        const newHeight = wnh.height !== undefined ? wnh.height : currentSize[1];
        window.setSize(newWidth, newHeight);
    });

    ipcMain.on('extend-window', (e, action) => {
        const currentSize = window.getSize();
        if (action === 'extend' && !windowExtended) {
            window.setSize(1200, currentSize[1])
            windowExtended = true;
        } else if (action === 'collapse' && windowExtended) {
            window.setSize(500, currentSize[1])
            windowExtended = false;
        }

    })
}

function createWebRTCInternalsWindow() {
    if (webrtcInternalsWindow) { // Prevent opening multiple instances
        webrtcInternalsWindow.focus();
        return;
    }

    webrtcInternalsWindow = new BrowserWindow({
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
}

function createWindow() {
    // get window bounds from config
    const { width, height } = store.get('windowBounds');
    const windowBounds = store.get('windowBounds');

    // 创建窗口配置
    const windowOptions = {
        title: 'RelayX',
        width: width,
        height: height,
        minWidth: 500,
        minHeight: 500,
        autoHideMenuBar: true,
        frame: false,
        webPreferences: {
            preload: join(__dirname, 'preload.mjs'),
            spellcheck: false,
            nodeIntegration: true,
            contextIsolation: true,
        }
    };

    // 如果配置中有 x 和 y 值，则使用它们
    if (windowBounds.x !== undefined && windowBounds.y !== undefined) {
        windowOptions.x = windowBounds.x;
        windowOptions.y = windowBounds.y;
    }

    mainWindow = new BrowserWindow(windowOptions);

    startBackendProcess(mainWindow, envFilePath);

    // sdp forward
    ipcMain.on('offer', (event, message) => {
        if (pionProcess) {
            console.log('forwarding offer to go subprocess')
            pionProcess.stdin.write(message + '\n');
        }
    });

    ipcMain.on('answer', (event, message) => {
        if (pionProcess) {
            console.log('forwarding answer to go subprocess')
            pionProcess.stdin.write(message + '\n');
        }
    });

    // async request TURN info
    ipcMain.handle('request-TURN-info', async () => {
        return TURNinfo;
    })

    ipcMain.handle('get-electron-pids', async () => {
        return getThrottledElectronProcessIds();
    })

    // destop capture
    ipcMain.handle('getScreenSources', async (e, d) => {
        return await getAvailableSources();
    })

    ipcMain.on('screen-capture-id', (e, d) => {
        setScreenCaptureId(d);
    })


    handleBasicWindowAction(mainWindow);

    // user config read & write
    ipcMain.handle('get-user-config', () => {
        return store.store;
    });

    ipcMain.on('set-user-config', (event, config, value) => {
        console.log('set-user-config', config, value);
        store.set(config, value);
    });

    // env config read & write
    ipcMain.handle('get-env-config', () => {
        let env = '';
        if (!envFilePath) {
            env = `${__dirname}/../.env`;
        } else {
            env = envFilePath;
        }
        console.log('env file path:', env);
        try {
            // Check if file exists, if not return empty object
            if (!fs.existsSync(env)) {
                return {};
            }
            const envFileContent = fs.readFileSync(env, { encoding: 'utf8' });
            const envConfig = dotenv.parse(envFileContent);
            return envConfig;
        } catch (error) {
            console.error('Failed to read or parse .env file:', error);
            return null;
        }
    });

    ipcMain.handle('set-env-config', (event, config) => {
        let env = '';
        if (!envFilePath) {
            env = `${__dirname}/../.env`;
        } else {
            env = envFilePath;
        }
        console.log('env file path:', env);
        try {
            const envString = Object.entries(config)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            fs.writeFileSync(env, envString);
            console.log('.env file updated at:', env);
            return true;
        } catch (error) {
            console.error('Failed to write .env file:', error);
            return false;
        }
    });


    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        // createWebRTCInternalsWindow();
    });

    // save window bounds and position
    mainWindow.on('resize', () => {
        if (!mainWindow.isMaximized()) {
            const { x, y, width, height } = mainWindow.getBounds();
            store.set('windowBounds', { x, y, width, height });
        }
    });

    mainWindow.on('move', () => {
        if (!mainWindow.isMaximized()) {
            const { x, y, width, height } = mainWindow.getBounds();
            store.set('windowBounds', { x, y, width, height });
        }
    });

    mainWindow.on('closed', () => {
        if (webrtcInternalsWindow && !webrtcInternalsWindow.isDestroyed()) {
            webrtcInternalsWindow.close();
        }
        mainWindow = null; // Dereference the main window object
        if (process.platform !== 'darwin') {
            // app.quit(); // This is handled by window-all-closed
        }
    });

    mainWindow.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
        event.preventDefault();
        callback(true);
    });

    if (isDev) {
        mainWindow.loadURL(`http://localhost:${devServerPort}`);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'));
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

app.whenReady().then(() => {
    // init display media request handler
    setDisplayMediaRequestHandler();

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (pionProcess && !pionProcess.killed) {
        console.log("Attempting to kill Go backend process...");
        pionProcess.kill();
    }
    if (askTailscaleStatusIntervalId) {
        clearInterval(askTailscaleStatusIntervalId);
    }
});
