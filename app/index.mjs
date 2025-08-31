import { app } from 'electron';
import { configName } from './utils/args.mjs';
import { initConfigStore } from './config/config-store.mjs';
import { installExtensions } from './utils/extansions.mjs';
import { setDisplayMediaRequestHandler } from './displayMediaRequestHandler/index.mjs';
import { createMainWindow, createWebRTCInternalsWindow } from './window/create-window.mjs';
import { setupWindowActions } from './window/window-actions.mjs';
import { startCpaProcess } from './subprocess/cpa.mjs';



const store = initConfigStore(configName);

let quitCpa

app.whenReady().then(() => {
    // install react devtools
    if (process.env.DEV) {
        installExtensions();
    }

    // setup electron desktop capture
    setDisplayMediaRequestHandler();

    // create app window
    const mainWindow = createMainWindow(store);
    setupWindowActions(mainWindow, store);
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    app.on('activate', () => {
        quitCpa = startCpaProcess(mainWindow);
    })
})

app.on('will-quit', () => {
    if (quitCpa) {
        quitCpa();
    }
    if (global.quitTurnTsProcess) {
        global.quitTurnTsProcess();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})