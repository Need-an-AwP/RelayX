import { useTURNStore, useTailscaleStore } from '@/stores'
import type { RTCOfferMessage, RTCAnswerMessage } from '@/types'

type StateChangeCallback = (state: RTCPeerConnectionState) => void;

export default class rtcConnection {
    private selfPeerIP: string;
    private peerID: string;
    private peerIP: string;
    private isOffer: boolean;
    private state: RTCPeerConnectionState | null = null;
    private pc: RTCPeerConnection | null = null;
    private iceList: RTCIceCandidate[] = [];
    private dataChannel: RTCDataChannel | null = null;
    private TURNconfig: RTCConfiguration | undefined = undefined;
    private SDPsent: boolean = false;
    private stateChangeCallback?: StateChangeCallback;
    private lastState: RTCPeerConnectionState = 'new';
    private reconnectTimer?: NodeJS.Timeout;
    private readonly RECONNECT_TIMEOUT = 10000;

    constructor(peerID: string, peerIP: string, isOffer: boolean) {
        this.selfPeerIP = useTailscaleStore.getState().tailscaleStatus?.Self?.TailscaleIPs[0] || '';
        this.peerID = peerID;
        this.peerIP = peerIP;
        this.isOffer = isOffer;
        this.init();
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

        const currentState = this.pc.connectionState;

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
                    From: this.selfPeerIP,
                    Offer: this.pc.localDescription,
                    Ice: [iceCandidate]
                };

                const strOfferMessage = JSON.stringify(offerMessage)
                window.ipcBridge.send('offer', strOfferMessage)
                console.log('offer sent:', strOfferMessage)
            }
            else if (role === 'answer') {
                const answerMessage: RTCAnswerMessage = {
                    type: 'answer',
                    Target: this.peerID,
                    From: this.selfPeerIP,
                    Answer: this.pc.localDescription,
                    Ice: [iceCandidate]
                }

                const strAnswerMessage = JSON.stringify(answerMessage)
                window.ipcBridge.send('answer', strAnswerMessage)
                console.log('answer sent:', strAnswerMessage)
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

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        this.dataChannel = dc;

        console.log('offer init done and try send SDP, iceList:', this.iceList)
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
            this.dataChannel = dc

            dc.onmessage = (e) => {
                console.log('answer side Data channel received message', e.data);
            }
        }
    }


    public async handleOffer(offer: RTCSessionDescription, iceList: RTCIceCandidate[]) {
        if (this.isOffer) {
            console.error('offer side is not allow to call handlrOffer');
            return;
        }
        if (!this.pc) {
            console.error('pc is not initialized when handling offer');
            return;
        }

        console.log('iceList', iceList)
        await this.pc.setRemoteDescription(offer);
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
        console.log('answer side has complete setting')
    }


    // only used as offer side
    private handleDataChannel(dc: RTCDataChannel) {
        dc.onopen = () => {
            console.log('Data channel opened');
            setInterval(() => {
                dc.send(JSON.stringify({ type: 'ping', time: Date.now() }))
            }, 2000)
        }

        dc.onclose = () => {
            console.log('Data channel closed');
        }

        dc.onerror = (e) => {
            console.error('Data channel error', e);
        }

        dc.onmessage = (e) => {
            console.log('offer side Data channel received message', e.data);
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
        this.iceList = [];
        this.clearReconnectTimer();
    }

}