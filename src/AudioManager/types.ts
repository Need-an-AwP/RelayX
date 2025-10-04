export interface PeerAudioNodes {
    gainNode: GainNode;
    analyserNode: AnalyserNode;
    muteGainNode: GainNode;
}

export interface TrackAudioNodes {
    gainNode: GainNode;
    sourceNode: MediaStreamAudioSourceNode;
}

export type peerNodesType = Record<string, PeerAudioNodes>;
export type trackNodesType = Record<string, Record<string, TrackAudioNodes>>;