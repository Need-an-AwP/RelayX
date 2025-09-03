import { create } from 'zustand';

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
            console.log(message);
            // try connect ws
            if (message.mediaWs && message.msgWs) {
                createWs(message.mediaWs, message.msgWs);
            }
        })

        window.ipcBridge.invoke('getWsInfo')
            .then((wsInfo) => {
                if (!wsInfo) return;
                console.log(wsInfo);
                // check info then try connect
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
        console.log('[ws] Media WebSocket connected');
    }

    msgWs.onopen = () => {
        console.log('[ws] Message WebSocket connected');
        /////////////////
        setInterval(() => {
            msgWs.send(JSON.stringify({ type: 'ping', message: 'test msg' }));
        }, 5000);
    }

    msgWs.onmessage = (event) => {
        console.log('[ws] Message WebSocket message received:', event.data);
    };

    setMediaWs(mediaWs);
    setMsgWs(msgWs);
}

const initializeWsListener = () => {
    const { initializeWsListener } = useWsStore.getState();
    initializeWsListener();
}

// useWsStore.getState().initializeWsListener();

export { useWsStore, initializeWsListener };
