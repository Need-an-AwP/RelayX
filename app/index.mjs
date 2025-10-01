import { app } from 'electron';
import { configName } from './utils/args.mjs';
import { initConfigStore } from './config/config-store.mjs';
import { installExtensions } from './utils/extansions.mjs';
import { setDisplayMediaRequestHandler } from './displayMediaRequestHandler/index.mjs';
import { registerIpcHandler } from './ipc/registerIpcHandler.mjs';
import { createMainWindow, createWebRTCInternalsWindow } from './window/create-window.mjs';
import { setupWindowActions } from './window/window-actions.mjs';
import { startCpaProcess } from './subprocess/cpa.mjs';
import { startTwgProcess } from './subprocess/twg.mjs';
import { initLogger } from './utils/logger.mjs';

// init log file writer
if (!process.env.DEV) {
    initLogger();
}

const store = initConfigStore(configName);

let quitCpa, quitTwg;

app.whenReady().then(() => {
    // install react devtools
    if (process.env.DEV) {
        installExtensions();
    }

    // setup electron desktop capture
    setDisplayMediaRequestHandler();

    // create app window
    const mainWindow = createMainWindow(store);
    // const rtcWindow = createWebRTCInternalsWindow();
    // mainWindow.on('closed', () => {
    //     if (rtcWindow && !rtcWindow.isDestroyed()) {
    //         rtcWindow.close();
    //     }
    // });

    registerIpcHandler(mainWindow, store);

    setupWindowActions(mainWindow, store);

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.once('did-finish-load', () => {
        // start capture process audio subprocess
        quitCpa = startCpaProcess(mainWindow);
        // start core tailscale webrtc gateway subprocess
        quitTwg = startTwgProcess(mainWindow, store);
    })
})

app.on('will-quit', () => {
    if (quitCpa) {
        quitCpa();
    }
    if (quitTwg) {
        quitTwg();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})