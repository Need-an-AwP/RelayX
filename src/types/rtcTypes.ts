export type RTCOfferMessage = {
    type: 'offer'
    From: string// peerIP for remote identification
    Target: string// peerID for local identification
    Offer: RTCSessionDescription
    Ice: RTCIceCandidate[]
    transceivers: Record<string, { type: string, mid: string }>
}

export type RTCAnswerMessage = {
    type: 'answer'
    From: string
    Target: string
    Answer: RTCSessionDescription
    Ice: RTCIceCandidate[]
}

export type ConnectionState = {
    peerID: string
    state: RTCPeerConnectionState
}

// transceivers identifier
export type TransceiverLabel =
    'micphone' |
    'capture_audio' |
    'screen_share_video' |
    'screen_share_audio' |
    'camera_video'

export type TrackType = 'audio' | 'video'

export type TransceiverInfo = {
    type: TrackType
    mid: string
}

export type TransceiverMetadata = Map<TransceiverLabel, TransceiverInfo>