import { useMirror } from "@/stores/mirrorStates";
import { useRTC } from "@/stores";
import type { RTCStatus } from '@/types'


class SyncService {
    private static instance: SyncService | null = null;
    private unsubscribeMirror: () => void;

    constructor() {
        // this.localSequence = 0
        this.unsubscribeMirror = useMirror.subscribe(
            (state) => {
                // console.log('sync state with datachannel', state);
                this.syncviaDataChannel(state);
            }
        )
    }

    private syncviaDataChannel(state: any) {
        const dataChannels = this.getAllDataChannel();
        const message = JSON.stringify({
            type: 'sync_status',
            status: state
        });

        dataChannels.forEach(dataChannel => {
            try {
                dataChannel.send(message);
            } catch (error) {
                console.error('Error sending sync message:', error);
            }
        });
    }

    private getAllDataChannel(): RTCDataChannel[] {
        const rtcStates = useRTC.getState().states;
        return Object.values(rtcStates)
            .filter(status =>
                status.state === 'connected')
            .map(status => status.dataChannel!)
    }

    public static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    public destroy() {
        if (this.unsubscribeMirror) {
            this.unsubscribeMirror();
        }
        SyncService.instance = null;
    }
}

export default SyncService