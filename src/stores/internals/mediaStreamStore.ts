import { create } from "zustand"
import type { MediaStreamStore } from "@/types/internals/mediaStreamStoreTypes"

const useMediaStream = create<MediaStreamStore>((set) => ({
    receivedAudioStream: {},
    receivedVideoStream: {},

    setReceivedAudioStream: (peerIP, stream) => set((state) => ({
        receivedAudioStream: { ...state.receivedAudioStream, [peerIP]: stream }
    })),
    setReceivedVideoStream: (peerIP, stream) => set((state) => ({
        receivedVideoStream: { ...state.receivedVideoStream, [peerIP]: stream }
    })),
    clearReceivedAudioStream: (peerIP) => set((state) => ({
        receivedAudioStream: { ...state.receivedAudioStream, [peerIP]: null }
    })),
    clearReceivedVideoStream: (peerIP) => set((state) => ({
        receivedVideoStream: { ...state.receivedVideoStream, [peerIP]: null }
    })),
}))

export { useMediaStream }