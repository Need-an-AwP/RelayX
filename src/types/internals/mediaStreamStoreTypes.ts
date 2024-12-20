export interface MediaStreamStore {
    receivedAudioStream: { [peerId: string]: MediaStream | null }
    receivedVideoStream: { [peerId: string]: MediaStream | null }
    setReceivedAudioStream: setReceivedStream
    setReceivedVideoStream: setReceivedStream
    clearReceivedAudioStream: clearReceivedStream
    clearReceivedVideoStream: clearReceivedStream
}

export type setReceivedStream = (peerId: string, stream: MediaStream) => void
export type clearReceivedStream = (peerId: string) => void