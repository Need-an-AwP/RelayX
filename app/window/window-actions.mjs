import { ipcMain } from 'electron';

let windowExtended = false;

export const setupWindowActions = (window, store) => {
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

    window.on('resize', () => {
        if (!window.isMaximized()) {
            const { x, y, width, height } = window.getBounds();
            store.set('windowBounds', { x, y, width, height });
        }
    });

    window.on('move', () => {
        if (!window.isMaximized()) {
            const { x, y, width, height } = window.getBounds();
            store.set('windowBounds', { x, y, width, height });
        }
    });

    window.on('closed', () => {
        if (global.webrtcInternalsWindow && !global.webrtcInternalsWindow.isDestroyed()) {
            global.webrtcInternalsWindow.close();
        }
        global.mainWindow = null; // Dereference the main window object
        if (process.platform !== 'darwin') {
            // app.quit(); // This is handled by window-all-closed
        }
    });

    window.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
        event.preventDefault();
        callback(true);
    });

    // this will disable showing menu by alt and ctrl+r refresh
    // window.removeMenu();
}