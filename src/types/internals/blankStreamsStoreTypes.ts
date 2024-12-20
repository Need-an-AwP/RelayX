export interface BlankStreamsStore {
    emptyAudioContext: AudioContext | null
    blankAudioStream: MediaStream | null
    blankVideoStream: MediaStream | null
    blankTrackIds: Record<string, string> | null
    setEmptyAudioContext: (context: AudioContext) => void
    setBlankAudioStream: (stream: MediaStream) => void
    setBlankVideoStream: (stream: MediaStream) => void
    setBlankTrackIds: (ids: Record<string, string>) => void
}