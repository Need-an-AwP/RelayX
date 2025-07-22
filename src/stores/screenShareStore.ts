import { create } from 'zustand'


export type CaptureSource = {
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
    stopScreenShare: () => void
}

export const useDesktopCapture = create<DesktopCaptureState>((set, get) => ({
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
    stopScreenShare: () => {
        const { stream } = get()
        if (!stream) return

        stream.getTracks().forEach(track => track.stop())
        set({ stream: null })

    }
}))