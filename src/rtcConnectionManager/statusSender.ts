import { usePeerStateStore } from "@/stores";

export default class StatusSender {
    private dc: RTCDataChannel;
    private timerId: NodeJS.Timeout | null = null;
    private peerIP: string;

    constructor(dc: RTCDataChannel, peerIP: string){
        this.peerIP = peerIP
        this.dc = dc
    }

    public start(interval: number = 1000){
        if(this.timerId){
            clearInterval(this.timerId)
        }

        this.timerId = setInterval(() => {
            this.sendStatus();
        }, interval)
    }

    public stop(){
        if (this.timerId){
            clearInterval(this.timerId)
            this.timerId = null
        }
    }

    private sendStatus(): void {
        if (this.dc.readyState === 'open') {
            const selfState = usePeerStateStore.getState().selfState
            const payload = {
                type: 'ping',
                state: selfState
            };
            // console.log('[StatusSender] sendStatus:', payload)
            this.dc.send(JSON.stringify(payload));

            usePeerStateStore.getState().updatePeerState(this.peerIP, {
                lastPingTime: Date.now()
            })
        } else {
            console.warn('Data channel is not open. Stopping status sender.');
            this.stop();
        }
    }
}