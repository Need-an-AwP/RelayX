import { create } from "zustand"
import type { BlankStreamsStore } from "@/types/internals/blankStreamsStoreTypes"

const useBlankStreams = create<BlankStreamsStore>((set) => ({
    emptyAudioContext: null,
    blankAudioStream: null,
    blankVideoStream: null,
    blankTrackIds: null,

    setEmptyAudioContext: (context) => set({ emptyAudioContext: context }),
    setBlankAudioStream: (stream) => set({ blankAudioStream: stream }),
    setBlankVideoStream: (stream) => set({ blankVideoStream: stream }),
    setBlankTrackIds: (ids) => set({ blankTrackIds: ids }),
}))

const initializeBlankStreams = () => {
    const store = useBlankStreams.getState()

    const emptyAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    store.setEmptyAudioContext(emptyAudioContext)

    const voiceTrack =
        emptyAudioContext.createMediaStreamDestination()
            .stream.getAudioTracks()[0];
    const screenAudioTrack =
        emptyAudioContext.createMediaStreamDestination()
            .stream.getAudioTracks()[0];
    const emptyVideoTrack = (() => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to create canvas context');
        }
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const stream = canvas.captureStream();
        const track = stream.getVideoTracks()[0];
        return track;
    })();

    store.setBlankAudioStream(new MediaStream([voiceTrack]))
    store.setBlankVideoStream(new MediaStream([emptyVideoTrack, screenAudioTrack]))
    store.setBlankTrackIds({
        'voice-audio': voiceTrack.id,
        'screen-audio': screenAudioTrack.id,
        'screen-video': emptyVideoTrack.id
    })// still useful in replace track
}

export { useBlankStreams, initializeBlankStreams }
