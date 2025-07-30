import { app } from 'electron';
import { installExtensions } from './utils/extansions.mjs';
import { configName } from './utils/args.mjs';
import { initConfigStore } from './config/config-store.mjs';
import { getExecutablePath } from './utils/get-exe-path.mjs';
import { createWindow, createWebRTCInternalsWindow } from './window/create-window.mjs';
import { startTurnTailscaleProcess } from './subprocess/start-turn-tailscale.mjs';
import { startCpaProcess } from './subprocess/start-cpa.mjs';
import { setupWindowActions } from './window/window-actions.mjs';
import { setDisplayMediaRequestHandler } from './displayMediaRequestHandler/index.mjs';
import { registerIpcHandler } from './ipc/registerIpcHandler.mjs';

global.webrtcInternalsWindow = null;
global.mainWindow = null;
global.TURNinfo = null;
global.envFilePath = null;

const { store } = initConfigStore(configName);

global.quitTurnTsProcess = null;
let quitCpaProcess;

app.whenReady().then(() => {
    installExtensions();

    setDisplayMediaRequestHandler();

    const mainWindow = createWindow(store);
    global.mainWindow = mainWindow;

    setupWindowActions(mainWindow, store);

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    // start subprocesses after main window is loaded
    mainWindow.webContents.once('did-finish-load', () => {
        const quitTurnTsProcess = startTurnTailscaleProcess(
            getExecutablePath('turn-on-tailscale.exe'),
            mainWindow
        );
        global.quitTurnTsProcess = quitTurnTsProcess;

        quitCpaProcess = startCpaProcess(
            getExecutablePath('process-audio-capture.exe'),
            mainWindow
        );
    })

    registerIpcHandler();
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (quitCpaProcess) {
        quitCpaProcess();
    }
    if (global.quitTurnTsProcess) {
        global.quitTurnTsProcess();
    }
});