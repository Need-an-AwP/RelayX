const { contextBridge, ipcRenderer, clipboard, desktopCapturer } = require('electron');

contextBridge.exposeInMainWorld('ipcBridge', {
    receive: (channel, callback) => {
        const subscription = (event, message) => {
            try {
                //if (channel === 'offer') {
                //    console.log(channel, typeof (message));
                //}
                callback(message);
            } catch (e) {
                console.log('error channel', channel, typeof (message));
                console.log(e);
            }
        };
        ipcRenderer.removeAllListeners(channel);
        ipcRenderer.on(channel, subscription);
        return subscription;
    },
    removeListener: (channel, subscription) => {
        ipcRenderer.removeListener(channel, subscription);
    },
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    invoke: (channel, data) => {
        return ipcRenderer.invoke(channel, data);
    },
    copy: (text) => {
        clipboard.writeText(text);
    },
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
});