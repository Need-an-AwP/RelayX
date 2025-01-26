import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type sourceInfo = {
    id: string,
    name: string,
    display_id: string,
    thumbnail: string,
    appIcon: string | null
}

export interface ScreenShareStore {
    isSelectingSource: boolean
    availableSources: sourceInfo[],
    stream: MediaStream | null

    setIsSelectingSource: (isSelecting: boolean) => void
    requestSources: () => Promise<void>,
    setStream: (stream: MediaStream | null) => void
}

export const useScreenShare = create<ScreenShareStore>()(
    subscribeWithSelector((set) => ({
        isSelectingSource: false,
        availableSources: [],
        stream: null,

        setIsSelectingSource: (isSelecting: boolean) => set({ isSelectingSource: isSelecting }),
        requestSources: async () => {
            const sources = await window.ipcBridge.invoke('getScreenSources')
            console.log(sources);
            set({ availableSources: sources });
        },
        setStream: (stream) => set({ stream }),
    }))
)