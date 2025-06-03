export type RTCOfferMessage = {
    type: 'offer'
    From: string// peerIP for remote identification
    Target: string// peerID for local identification
    Offer: RTCSessionDescription
    Ice: RTCIceCandidate[]
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