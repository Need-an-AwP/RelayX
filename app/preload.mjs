import { contextBridge, ipcRenderer, clipboard, shell } from 'electron';

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
    
    getScreenSources: () => ipcRenderer.invoke('getScreenSources'),

    getUserConfig: () => ipcRenderer.invoke('get-user-config'),
    setUserConfig: (config) => ipcRenderer.invoke('set-user-config', config),

    getInitAudioDevice: () => ipcRenderer.invoke('get-init-audio-device'),
    setInitAudioDevice: (device) => ipcRenderer.invoke('set-init-audio-device', device),

    getEnvConfig: () => ipcRenderer.invoke('get-env-config'),
    setEnvConfig: (config) => ipcRenderer.invoke('set-env-config', config)
});


const test_addon = require('win-process-audio-capture');

contextBridge.exposeInMainWorld('winAudioCapture', {
    getElectronProcessId: () => ipcRenderer.invoke('get-electron-pids'),
    getAudioProcessInfo: () => test_addon.getAudioProcessInfo(),
    initializeCapture: () => test_addon.initializeCapture(),
    initializeCLoopbackCapture: (processId) => test_addon.initializeCLoopbackCapture(processId),
    getActivateStatus: () => test_addon.getActivateStatus(),
    whileCaptureProcessAudio: () => test_addon.whileCaptureProcessAudio(),
    capture_async: (intervalMs, callback) => test_addon.capture_async(intervalMs, callback),
});