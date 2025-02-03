export interface IpcBridge {
    receive: (channel: string, callback: (message: any) => void) => (event: any, message: any) => void;
    removeListener: (channel: string, subscription: (event: any, message: any) => void) => void;
    send: (channel: string, data?: any) => void;
    invoke: (channel: string, data?: any) => Promise<any>;
    copy: (text: string) => void;
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
}

export interface WinAudioCapture {
    getElectronProcessId: () => Promise<number[]>;
    getAudioProcessInfo: () => any;
    initializeCapture: () => void;
    initializeCLoopbackCapture: (processId: number) => void;
    getActivateStatus: () => { interfaceActivateResult: number };
    whileCaptureProcessAudio: () => void;
    capture_async: (intervalMs: number, callback: (err: any, result: any) => void) => void;
}

declare global {
    interface Window {
        ipcBridge: IpcBridge;
        winAudioCapture: WinAudioCapture;
        webkitAudioContext: typeof AudioContext;
    }
} 