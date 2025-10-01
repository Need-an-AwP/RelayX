const { contextBridge, ipcRenderer, clipboard } = require('electron');

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
    openURL: (url) => {
        shell.openExternal(url);
    },
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    resizeWindow: (wnh) => ipcRenderer.send('resize-window', wnh),
    extendWindow: (action)=> ipcRenderer.send('extend-window', action),
    
    getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
    setScreenCaptureId: (id) => ipcRenderer.send('set-screen-capture-id', id),

    getUserConfig: () => ipcRenderer.invoke('get-user-config'),
    setUserConfig: (config, value) => ipcRenderer.send('set-user-config', config, value),

    getEnvConfig: () => ipcRenderer.invoke('get-env-config'),
    setEnvConfig: (config) => ipcRenderer.send('set-env-config', config),
    restartTwg: () => ipcRenderer.send('restart-twg'),
    closeTwg: () => ipcRenderer.send('close-twg'),
});

contextBridge.exposeInMainWorld('cpa', {
    getAudioSessions: () => ipcRenderer.send('get-audio-sessions'),
    startCapture: (pid) => ipcRenderer.send('start-capture', pid),
    stopCapture: () => ipcRenderer.send('stop-capture'),
})