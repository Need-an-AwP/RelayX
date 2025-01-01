// states is a collection of all rtc status
// status is for single peer connection info 
export interface RTCStatus {
    state: string
    latency: number
    peer: RTCPeerConnection | null
    dataChannel: RTCDataChannel | null
    isOffer: boolean
    userConfig: any
}

export interface RTCStates {
    [peerIP: string]: RTCStatus;
}

export interface RTCMessage {
    type: 'offer-with-candidates' | 'answer-with-candidates' | 'ask-offer'
    sender: {
        ipv4: string
        ipv6: string
    }
    offer?: RTCSessionDescriptionInit
    answer?: RTCSessionDescriptionInit
    candidates?: RTCIceCandidate[]
}

export type SetStatus = (peerIP: string, status: RTCStatus) => void;
export type UpdateStatus = (peerIP: string, updates: Partial<RTCStatus>) => void;
export type RemoveStatus = (peerIP: string) => void;

export interface RTCStore {
    states: RTCStates
    setStatus: SetStatus
    updateStatus: UpdateStatus
    removeStatus: RemoveStatus
}