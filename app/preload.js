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

/** 
const test_addon = require('win-process-audio-capture');

contextBridge.exposeInMainWorld('winAudioCapture', {
    getElectronProcessId: () => ipcRenderer.invoke('getElectronPids'),
    getAudioProcessInfo: () => test_addon.getAudioProcessInfo(),
    initializeCapture: () => test_addon.initializeCapture(),
    initializeCLoopbackCapture: (processId) => test_addon.initializeCLoopbackCapture(processId),
    getActivateStatus: () => test_addon.getActivateStatus(),
    whileCaptureProcessAudio: () => test_addon.whileCaptureProcessAudio(),
    capture_async: (intervalMs, callback) => test_addon.capture_async(intervalMs, callback),
});
*/