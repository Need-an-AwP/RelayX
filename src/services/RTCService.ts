// import { useTailscale } from '@/stores/tailscaleStore'
// import type { TailscaleStatus, IPs } from '@/types/tailscaleStoreTypes'
import sendViaTailscale from '@/utils/tailscaleProxy'
import RTCConnectionManager from '@/services/RTCConnectionManager'
// import type { RTCMessage } from '@/types/rtcTypes'

import { useTailscale } from '@/stores'
import type { TailscaleStatus, IPs, RTCMessage } from '@/types'

class RTCService {
    private static instance: RTCService
    private unsubscribeTailscale: () => void
    public selfUUID: string;
    public isTailscaleAuthKey: boolean;
    private askIntervals: Map<string, NodeJS.Timeout>;
    private RTCs: Map<string, RTCConnectionManager>;
    private pendingMessages: Map<string, RTCMessage>;
    private isOffer: Map<string, boolean>;

    constructor() {
        this.selfUUID = ''
        this.isTailscaleAuthKey = false
        this.unsubscribeTailscale = () => { }
        this.askIntervals = new Map()
        this.RTCs = new Map()
        this.pendingMessages = new Map()
        this.isOffer = new Map()
        this.initializeStatusWatcher()
        this.initHTTPMessageReceiver()
        this.getUUID()
    }


    private initializeStatusWatcher() {
        // subscribe two states which is updated separately will trigger callback twice
        // so checking new and prev state is necessary
        // or just subscribe only one state
        this.unsubscribeTailscale = useTailscale.subscribe(
            ({ status }) => {
                this.handleTailscaleUpdate({
                    status,
                    selfIPs: useTailscale.getState().selfIPs
                })
            })
    }

    private processPendingData(pendingData: RTCMessage, targetPeerIP: string) {
        const rtc = this.RTCs.get(targetPeerIP)
        if (!rtc) return

        switch (pendingData.type) {
            case 'offer-with-candidates':
                rtc.handleOfferWithCandidates(pendingData);
                break;
            case 'answer-with-candidates':
                rtc.handleAnswerWithCandidates(pendingData);
                break;
            case 'ask-offer':
                break;
            default:
                console.log('unknown pending message type:', pendingData.type);
                break;
        }

        this.pendingMessages.delete(targetPeerIP)
    }

    private onRTCCreated(targetPeerIP: string) {
        const pendingData = this.pendingMessages.get(targetPeerIP)
        if (pendingData) {
            this.processPendingData(pendingData, targetPeerIP)
        }
    }

    private async handleTailscaleUpdate(
        { status, selfIPs }: { status: TailscaleStatus | null, selfIPs: IPs }
    ) {
        // console.log(status, selfIPs)
        if (!status?.Peer || !selfIPs || !this.selfUUID) return

        Object.values(status.Peer).forEach(async peer => {
            const address = peer.TailscaleIPs[0];

            if (peer.Online && !this.askIntervals.has(address)) {
                this.askIntervals.set(address, setInterval(async () => {
                    try {
                        const response = await sendViaTailscale(address, {
                            type: 'uuid',
                            sender: { ipv4: selfIPs.ipv4, ipv6: selfIPs.ipv6 },
                            uuid: this.selfUUID
                        });
                        const data = await response.text();
                        const json = JSON.parse(data);
                        if (json.type === 'uuid' && json.uuid) {
                            const peerUUID = json.uuid
                            clearInterval(this.askIntervals.get(address));
                            if (Number(peerUUID) > Number(this.selfUUID)) {
                                console.log(`create offer and send to ${address}`)
                                this.isOffer.set(address, true)
                                this.RTCs.set(address, new RTCConnectionManager(address, true))
                                this.onRTCCreated(address)
                            } else {
                                console.log(`wait for offer from ${address}`)
                                this.isOffer.set(address, false)
                                this.RTCs.set(address, new RTCConnectionManager(address, false))
                                this.onRTCCreated(address)
                            }
                        }
                    } catch (err) {
                        console.log(`获取 ${address} 的 UUID 失败:`, err);
                    }
                }, 5000))
            }
        })
    }

    private initHTTPMessageReceiver() {
        window.ipcBridge.receive('http-server-message', (msg: { from: string, message: string }) => {
            console.log('http-server-message', msg);
            try {
                const clientIP = msg.from
                const data = JSON.parse(msg.message)
                if (data.type === 'uuid') return;

                this.handleHttpMessage(data)
            } catch (err) {
                console.error('handle received message error:', err);
            }
        })
    }

    private async handleHttpMessage(data: RTCMessage) {
        const ip = data.sender.ipv4
        const rtc = this.RTCs.get(ip)
        if (rtc) {
            switch (data.type) {
                case 'offer-with-candidates':
                    rtc.handleOfferWithCandidates(data);
                    break;
                case 'answer-with-candidates':
                    rtc.handleAnswerWithCandidates(data);
                    break;
                case 'ask-offer':
                    if (this.isOffer.get(ip)) {//answer if this is offer side
                        rtc.createRTCConnection();// recreate local rtc connection and send offer
                    }
                    break;
                default:
                    console.log('unknown message type:', data.type);
                    break;
            }
        } else {
            console.log(`no rtc for ${ip}, stored it`);
            this.pendingMessages.set(ip, data);
        }
    }


    private async getUUID() {
        const {setIsTailscaleAuthKey} = useTailscale.getState()
        const res = await window.ipcBridge.invoke('ask_uuid')
        this.selfUUID = res.uuid
        this.isTailscaleAuthKey = res.isTailscaleAuthKey
        setIsTailscaleAuthKey(this.isTailscaleAuthKey)
    }

    public static getInstance(): RTCService {
        if (!RTCService.instance) {
            RTCService.instance = new RTCService()
        }
        return RTCService.instance
    }
}

export default RTCService   
