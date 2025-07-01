import { create } from 'zustand'


type CaptureSource = {
    id: string
    name: string
    appIcon: string
    display_id: string
    thumbnail: string
}

interface DesktopCaptureState {
    stream: MediaStream | null
    isSelectingSource: boolean
    captureSources: CaptureSource[]

    setCaptureSources: (sources: CaptureSource[]) => void
    requestSources: () => Promise<void>
    setIsSelectingSource: (isSelectingSource: boolean) => void
    setStream: (stream: MediaStream | null) => void
}

export const useDesktopCapture = create<DesktopCaptureState>((set) => ({
    stream: null,
    isSelectingSource: false,
    captureSources: [],
    setCaptureSources: (captureSources: CaptureSource[]) => set({ captureSources }),
    requestSources: async () => {
        const sources = await window.ipcBridge.getScreenSources()
        console.log(sources);
        set({ captureSources: sources });
    },
    setIsSelectingSource: (isSelectingSource: boolean) => set({ isSelectingSource }),
    setStream: (stream: MediaStream | null) => set({ stream }),
}))