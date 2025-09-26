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
    reflectStream: MediaStream | null
    isSelectingSource: boolean
    isCapturing: string | null
    captureSources: CaptureSource[]

    setCaptureSources: (sources: CaptureSource[]) => void
    requestSources: () => Promise<void>
    setIsSelectingSource: (isSelectingSource: boolean) => void
    setIsCapturing: (isCapturing: string | null) => void
    setStream: (stream: MediaStream | null) => void
    setReflectStream: (reflectStream: MediaStream | null) => void
    stopScreenShare: () => void
}

export const useDesktopCapture = create<DesktopCaptureState>((set, get) => ({
    stream: null,
    reflectStream: null,
    isSelectingSource: false,
    isCapturing: null,
    captureSources: [],
    setCaptureSources: (captureSources: CaptureSource[]) => set({ captureSources }),
    requestSources: async () => {
        const sources = await window.ipcBridge.getScreenSources()
        console.log(sources);
        set({ captureSources: sources });
    },
    setIsSelectingSource: (isSelectingSource: boolean) => set({ isSelectingSource }),
    setIsCapturing: (isCapturing: string | null) => set({ isCapturing }),
    setStream: (stream: MediaStream | null) => set({ stream }),
    setReflectStream: (reflectStream: MediaStream | null) => set({ reflectStream }),
    stopScreenShare: () => {
        const { stream } = get()
        if (!stream) return

        stream.getTracks().forEach(track => track.stop())
        set({ stream: null })

    }
}))