import { create } from 'zustand'

export type sourceInfo = {
    id: string,
    name: string,
    display_id: string,
    thumbnail: string,
    appIcon: string | null
}

export interface ScreenShareStore {
    availableSources: sourceInfo[],
    stream: MediaStream | null
    requestSources: () => Promise<void>,
    setStream: (stream: MediaStream | null) => void
}

export const useScreenShare = create<ScreenShareStore>()(
    (set) => ({
        availableSources: [],
        stream: null,

        requestSources: async () => {
            const sources = await window.ipcBridge.invoke('getScreenSources')
            console.log(sources);
            set({ availableSources: sources });
        },
        setStream: (stream) => set({ stream }),
    })
)