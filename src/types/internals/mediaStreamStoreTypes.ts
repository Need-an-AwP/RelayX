export interface MediaStreamStore {
    receivedAudioStream: { [peerIP: string]: MediaStream | null }
    receivedVideoStream: { [peerIP: string]: MediaStream | null }
    setReceivedAudioStream: setReceivedStream
    setReceivedVideoStream: setReceivedStream
    clearReceivedAudioStream: clearReceivedStream
    clearReceivedVideoStream: clearReceivedStream
}

export type setReceivedStream = (peerIP: string, stream: MediaStream) => void
export type clearReceivedStream = (peerIP: string) => void