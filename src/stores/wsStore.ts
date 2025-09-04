import { create } from 'zustand';
import { useRemoteUsersStore } from './remoteUsersStateStore';
import { PeerStateSchema } from '@/types';

interface wsStateStore {
    mediaWs: WebSocket | null;
    msgWs: WebSocket | null;
    setMediaWs: (ws: WebSocket | null) => void;
    setMsgWs: (ws: WebSocket | null) => void;
    initializeWsListener: () => void;
    sendMsg: (msg: any) => void;
    sendMedia: (msg: any) => void;
}

const useWsStore = create<wsStateStore>((set, get) => ({
    mediaWs: null,
    msgWs: null,
    setMediaWs: (ws) => set({ mediaWs: ws }),
    setMsgWs: (ws) => set({ msgWs: ws }),
    initializeWsListener: () => {
        window.ipcBridge.receive('ws', (message: any) => {
            // console.log(message);
            if (message.mediaWs && message.msgWs) {
                createWs(message.mediaWs, message.msgWs);
            }
        })

        window.ipcBridge.invoke('getWsInfo')
            .then((wsInfo) => {
                if (!wsInfo) return;
                // console.log(wsInfo);
                if (wsInfo.mediaWs && wsInfo.msgWs) {
                    createWs(wsInfo.mediaWs, wsInfo.msgWs);
                }
            })
    },
    sendMsg: (msg: any) => {
        const { msgWs } = get();
        if (!msgWs) return;

        msgWs.send(JSON.stringify(msg));
    },
    sendMedia: (msg: any) => {
        const { mediaWs } = get();
        if (!mediaWs) return;

        mediaWs.send(JSON.stringify(msg));
    }
}));

const createWs = (mediaWsAddr: string, msgWsAddr: string) => {
    const { setMediaWs, setMsgWs } = useWsStore.getState();

    const mediaWs = new WebSocket(mediaWsAddr);
    const msgWs = new WebSocket(msgWsAddr);

    mediaWs.onopen = () => {
        console.log('[ws] Media WebSocket connected:', mediaWsAddr);
    }

    msgWs.onopen = () => {
        console.log('[ws] Message WebSocket connected:', msgWsAddr);
    }

    msgWs.onmessage = (event) => {
        // console.log('[ws] Message WebSocket message received:', event.data);
        handleWsMessage(event);
    };

    setMediaWs(mediaWs);
    setMsgWs(msgWs);
}

const handleWsMessage = (event: MessageEvent) => {
    try {
        const msg = JSON.parse(event.data);
        if (!msg.type) return
        switch (msg.type) {
            case 'userState':
                if (!msg.from || !msg.userState || typeof msg.from !== 'string') {
                    console.error('[ws] missing "userState" or "from" field:', msg);
                    break;
                }

                if (PeerStateSchema.safeParse(msg.userState).success) {
                    useRemoteUsersStore.getState().updatePeerState(msg.from, msg.userState);
                }
                break;
            case "rtc_status":
                console.log('rtc_status', msg);
                break;
        }
    } catch (err) {
        console.error('[ws] Failed to parse message:', err);
    }
}

const initializeWsListener = () => {
    const { initializeWsListener } = useWsStore.getState();
    initializeWsListener();
}

// useWsStore.getState().initializeWsListener();

export { useWsStore, initializeWsListener };
