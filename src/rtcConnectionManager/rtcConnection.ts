import { useTURNStore, useTailscaleStore, usePeerStateStore, useMediaStore, useMessageStore } from '@/stores'
import type { PeerState } from '@/stores'
import type {
    RTCOfferMessage, RTCAnswerMessage, TransceiverMetadata, TransceiverLabel,
    TransceiverInfo, TrackType, DirectMessage, PingMessage, MessageType
} from '@/types'
import StatusSender from './statusSender'

type StateChangeCallback = (state: RTCPeerConnectionState) => void;

export default class rtcConnection {
    private peerID: string;
    private peerIP: string;
    private isOffer: boolean;
    private state: RTCPeerConnectionState | null = null;
    private pc: RTCPeerConnection | null = null;
    private reservedTracks: Array<{ type: TrackType, label: TransceiverLabel, transceiver: RTCRtpTransceiver | null }> = [
        { type: 'audio', label: 'micphone', transceiver: null },
        { type: 'audio', label: 'capture_audio', transceiver: null },
        { type: 'video', label: 'screen_share_video', transceiver: null },
    ];
    private localTransceiverMetadata: TransceiverMetadata = new Map();
    private iceList: RTCIceCandidate[] = [];
    private dataChannel: RTCDataChannel | null = null;
    private TURNconfig: RTCConfiguration | undefined = undefined;
    private SDPsent: boolean = false;
    private stateChangeCallback?: StateChangeCallback;
    private lastState: RTCPeerConnectionState = 'new';
    private reconnectTimer?: NodeJS.Timeout;
    private readonly RECONNECT_TIMEOUT = 10000;
    private statusSender: StatusSender | null = null;

    constructor(peerID: string, peerIP: string, isOffer: boolean) {
        this.peerID = peerID;
        this.peerIP = peerIP;
        this.isOffer = isOffer;
        this.init();
    }

    // 获取当前的 selfPeerIP
    private getSelfPeerIP(): string {
        return useTailscaleStore.getState().tailscaleStatus?.Self?.TailscaleIPs[0] || '';
    }

    // 设置状态变化回调
    public setStateChangeCallback(callback: StateChangeCallback) {
        this.stateChangeCallback = callback;
    }

    // 获取当前状态
    public getState(): RTCPeerConnectionState | null {
        return this.state;
    }

    // 获取peerID
    public getPeerID(): string {
        return this.peerID;
    }

    public getPeerIP(): string {
        return this.peerIP;
    }


    private clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
    }

    private async handleReconnect() {
        if (!this.pc) return;

        // const currentState = this.pc.connectionState;

        await this.init();
    }

    private setOfferSideReconnectTimer() {
        if (!this.isOffer) return;

        this.reconnectTimer = setInterval(() => {
            if (!this.pc) return;

            const state = this.pc.connectionState;
            console.log('setOfferSideReconnectTimer pc state:', state)

            if (state === 'closed' || state === 'connected') {
                this.lastState = state;
                return;
            }
            if (state === this.lastState) {
                if (state === 'failed' || state === 'disconnected') {
                    // this.clearReconnectTimer();
                    console.log('handleReconnect, reconnect timer cleared')
                    // this.handleReconnect();
                    // todo: clear this instance, let http accessibility handle it
                }

                console.log('Reconnecting...');
                this.handleReconnect();
            }

            this.lastState = state;

        }, this.RECONNECT_TIMEOUT);
    }

    private notifyStateChange(newState: RTCPeerConnectionState) {
        this.state = newState;

        if (this.stateChangeCallback) {
            this.stateChangeCallback(newState);
        }
    }

    private async init() {
        const { getConfig } = useTURNStore.getState();
        try {
            this.TURNconfig = await getConfig();
            console.log('TURN config:', this.TURNconfig)
        } catch (error) {
            console.error('Failed to get TURN config:', error);
        }

        if (this.isOffer) {
            await this.initAsOffer()
        } else {
            await this.initAsAnswer()
        }
    }

    // only handle one ice candidate
    private attemptSendSDP(iceCandidate: RTCIceCandidate, role: 'offer' | 'answer') {
        if (this.pc && this.pc.localDescription && iceCandidate && !this.SDPsent) {
            if (role === 'offer') {
                const offerMessage: RTCOfferMessage = {
                    type: 'offer',
                    Target: this.peerID,
                    From: this.getSelfPeerIP(),
                    Offer: this.pc.localDescription,
                    Ice: [iceCandidate],
                    transceivers: Object.fromEntries(this.localTransceiverMetadata)
                };

                const strOfferMessage = JSON.stringify(offerMessage)
                window.ipcBridge.send('offer', strOfferMessage)
                // console.log('offer sent:', strOfferMessage)
            }
            else if (role === 'answer') {
                const answerMessage: RTCAnswerMessage = {
                    type: 'answer',
                    Target: this.peerID,
                    From: this.getSelfPeerIP(),
                    Answer: this.pc.localDescription,
                    Ice: [iceCandidate],
                }

                const strAnswerMessage = JSON.stringify(answerMessage)
                window.ipcBridge.send('answer', strAnswerMessage)
                // console.log('answer sent:', strAnswerMessage)
            }
            this.SDPsent = true;
        }
    }

    public async initAsOffer() {
        await this.cleanup();

        const pc = new RTCPeerConnection(this.TURNconfig);
        this.pc = pc;

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                console.log('ICE Candidate collected:', {
                    candidate: e.candidate.candidate,
                    type: e.candidate.candidate.match(/typ (\w+)/)?.[1] || 'unknown',
                    ip: e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/)?.[1] || 'unknown',
                    port: e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+) (\d+)/)?.[2] || 'unknown'
                });
                this.iceList.push(e.candidate);

                this.attemptSendSDP(e.candidate, 'offer');
            }
        };

        // pc.onicegatheringstatechange = async () => {
        // this.attemptSendOffer();
        // };

        pc.onconnectionstatechange = () => {
            if (this.pc) {
                this.notifyStateChange(this.pc.connectionState);
            }
        };

        const dc = pc.createDataChannel('data', { ordered: false });
        this.handleDataChannel(dc);

        this.reservedTracks.forEach(obj => {
            const transceiver = pc.addTransceiver(obj.type, { direction: 'sendrecv' });
            obj.transceiver = transceiver;
        });

        pc.ontrack = (e) => {
            console.log('offer side ontrack:', e)
            const track = e.track
            const transceiver = e.transceiver
            if (transceiver.mid) {
                this.storeTrack(track, transceiver.mid)
            }
        }

        const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
            // offer to receive video will request answer side to provide a video track ONLY ENABLED WHEN VIDEO TRANCEIVER IS ADDED
            // when video transceiver is not added, answer side will respond with a new sendonly video track
        });
        await pc.setLocalDescription(offer);

        // set local transceiver metadata after setting local description
        this.reservedTracks.forEach(obj => {
            if (obj.transceiver?.mid) {
                this.localTransceiverMetadata.set(obj.label, { type: obj.type, mid: obj.transceiver.mid });
            }
        });

        this.dataChannel = dc;

        // console.log('offer init done and try send SDP, iceList:', this.iceList)
        this.attemptSendSDP(this.iceList[0], 'offer');

        // this.setOfferSideReconnectTimer();
    }


    public async initAsAnswer() {
        await this.cleanup()

        const pc = new RTCPeerConnection(this.TURNconfig)
        this.pc = pc

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                this.iceList.push(e.candidate)

                this.attemptSendSDP(e.candidate, 'answer');
            }
        }

        pc.onicegatheringstatechange = async () => {
            if (pc.iceGatheringState === 'complete') { }
        }

        pc.onconnectionstatechange = () => {
            this.notifyStateChange(pc.connectionState);
        }

        pc.ondatachannel = (e) => {
            const dc = e.channel
            this.handleDataChannel(dc);
            this.dataChannel = dc
        }

        pc.ontrack = (e) => {
            console.log('answer side ontrack', e)
            const track = e.track;
            const transceiver = e.transceiver;
            if (transceiver.mid) {
                this.storeTrack(track, transceiver.mid)
            }
        }
    }


    public async handleOffer(
        offer: RTCSessionDescription,
        iceList: RTCIceCandidate[],
        transceivers: Record<string, { type: string; mid: string }>
    ) {
        if (this.isOffer) {
            console.error('offer side is not allow to call handlrOffer');
            return;
        }
        if (!this.pc) {
            console.error('pc is not initialized when handling offer');
            return;
        }

        const newMetadata: TransceiverMetadata = new Map();
        for (const [label, info] of Object.entries(transceivers)) {
            newMetadata.set(label as TransceiverLabel, {
                mid: info.mid,
                type: info.type as TrackType
            });
        }
        this.localTransceiverMetadata = newMetadata;
        console.log('Received and stored remote transceiver metadata:', this.localTransceiverMetadata);

        await this.pc.setRemoteDescription(offer);

        // manually set direction to sendrecv for all transceivers
        this.pc.getTransceivers().forEach(transceiver => {
            transceiver.direction = 'sendrecv';
        });

        await this.pc.addIceCandidate(iceList[0]);
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        this.attemptSendSDP(this.iceList[0], 'answer');
    }

    public async handleAnswer(answer: RTCSessionDescription, iceList: RTCIceCandidate[]) {
        if (!this.isOffer) {
            console.error('answer side is not allow to call handleAnswer');
            return;
        }
        if (!this.pc) {
            console.error('pc is not initialized when handling answer');
            return;
        }

        await this.pc.setRemoteDescription(answer);
        await this.pc.addIceCandidate(iceList[0]);
    }

    public sendDirectMessage(content: string) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const message: DirectMessage = {
                type: 'dm' as MessageType,
                content: content,
                from: this.peerIP,
                timestamp: Date.now(),
                messageId: crypto.randomUUID()
            };
            this.dataChannel.send(JSON.stringify(message));
        } else {
            console.warn(`Data channel to ${this.peerIP} is not open, cannot send message.`);
        }
    }

    public replaceTrack(track: MediaStreamTrack | null, label: TransceiverLabel) {
        if (!this.pc) {
            console.error('pc is not initialized when replacing track');
            return;
        }
        if (!this.localTransceiverMetadata.has(label)) {
            console.error('label is not found in localTransceiverMetadata');
            return;
        }

        const targetMid = this.localTransceiverMetadata.get(label)?.mid
        const transceiver = this.pc.getTransceivers().find(t => t.mid === targetMid)
        if (!transceiver) {
            console.error('transceiver is not found');
            return;
        }
        transceiver.sender.replaceTrack(track)
        console.log('replaceTrack ' + label + ' done')
    }

    private storeTrack(track: MediaStreamTrack, mid: string) {
        let metadataLabel: TransceiverLabel | undefined;
        let metadataInfo: TransceiverInfo | undefined;

        for (const [label, info] of this.localTransceiverMetadata.entries()) {
            if (info.mid === mid) {
                metadataLabel = label;
                metadataInfo = info;
                break;
            }
        }

        if (metadataInfo && metadataLabel) {
            console.log(`Received and storing track with label: ${metadataLabel} from peer ${this.peerIP}`);
            useMediaStore.getState().addTrack(
                this.peerIP,
                metadataInfo.type as TrackType,
                metadataLabel as TransceiverLabel,
                track
            );
        } else {
            console.error(`Received track with mid: ${mid}, but no matching metadata was found.`);
        }
    }

    private handleDataChannel(dc: RTCDataChannel) {
        dc.onopen = () => {
            console.log('Data channel opened');

            // start status sender
            this.statusSender = new StatusSender(dc, this.peerIP);
            this.statusSender.start();

            // add peer state store
            usePeerStateStore.getState().addPeer(this.peerIP);
        }

        dc.onclose = () => {
            console.log('Data channel closed');
        }

        dc.onerror = (e) => {
            console.error('Data channel error', e);
        }

        dc.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data)

                switch (data.type) {
                    case 'ping':
                        data as PingMessage
                        const state = data.state
                        // pass full state to peerStateStore, let immer handle it
                        usePeerStateStore.getState().updatePeerState(this.peerIP, {
                            userName: state.userName,
                            userAvatar: state.userAvatar,
                            isInChat: state.isInChat,
                            isInputMuted: state.isInputMuted,
                            isOutputMuted: state.isOutputMuted,
                            isSharingScreen: state.isSharingScreen,
                            isSharingAudio: state.isSharingAudio,
                            // latency: latency,
                            // lastPingTime: now
                        })

                        dc.send(JSON.stringify({
                            type: 'pong',
                        }))
                        break;
                    case 'pong':
                        const now = Date.now()
                        const lastPingTime = usePeerStateStore.getState().getPeerLatency(this.peerIP)?.lastPingTime || 0;
                        const latency = now - lastPingTime > 2000 ? 2000 : now - lastPingTime
                        usePeerStateStore.getState().updatePeerLatency(this.peerIP, { latency })
                        break;
                    case 'dm':
                        data as DirectMessage
                        console.log('receive dm', data)
                        useMessageStore.getState().addMessage(this.peerIP, data as DirectMessage)
                        break;
                    default:
                        console.error('Unknown data type', data.type)
                        break;
                }
            }
            catch (e) {
                console.error('Data channel received message is not a valid JSON', e)
            }


        }
    }

    public async cleanup() {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        useMediaStore.getState().removePeerTracks(this.peerIP);
        this.iceList = [];
        this.clearReconnectTimer();

        if (this.statusSender) {
            this.statusSender = null;
        }
    }

}