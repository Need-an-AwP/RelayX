export interface IpcBridge {
    receive: (channel: string, callback: (message: any) => void) => (event: any, message: any) => void;
    removeListener: (channel: string, subscription: (event: any, message: any) => void) => void;
    send: (channel: string, data?: any) => void;
    invoke: (channel: string, data?: any) => Promise<any>;
    copy: (text: string) => void;
    openURL: (url: string) => void;
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    resizeWindow: (wnh: { width?: number, height?: number }) => void;
    extendWindow: (action: 'extend' | 'collapse') => void;

    getScreenSources: () => Promise<any>;
    setScreenCaptureId: (id: string) => void;

    getUserConfig: () => Promise<any>;
    setUserConfig: (config: string, value: string) => void;

    getEnvConfig: () => Promise<any>;
    setEnvConfig: (config: any) => Promise<any>;
}

export interface Cpa {
    getAudioSessions: () => void;
    startCapture: (pid: number) => void;
    stopCapture: () => void;
}

declare global {
    interface Window {
        ipcBridge: IpcBridge;
        cpa: Cpa;
        webkitAudioContext: typeof AudioContext;
    }
} 