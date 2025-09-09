export interface PeerAudioNodes {
    gainNode: GainNode;
    analyserNode: AnalyserNode;
}

export interface TrackAudioNodes {
    gainNode: GainNode;
    sourceNode: MediaStreamAudioSourceNode;
}

export type peerNodesType = Record<string, PeerAudioNodes>;
export type trackNodesType = Record<string, Record<string, TrackAudioNodes>>;