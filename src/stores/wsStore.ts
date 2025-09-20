import { create } from 'zustand';
import { useRemoteUsersStore } from './remoteUsersStateStore';
import { syncMirrorState } from './localUserStateStore';
import { useDMStore } from './dmStore';
import { useLatencyStore } from './latencyStore';
import { PeerStateSchema, TrackID, type TrackIDType } from '@/types';
import { AudioDecoderManager, VideoDecoderManager } from '@/MediaTrackManager';

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

    // mediaWs handlers
    mediaWs.onopen = () => {
        console.log('[ws] Media WebSocket connected:', mediaWsAddr);
    }
    mediaWs.onclose = () => {
        console.log('[ws] Media WebSocket disconnected');
    }

    mediaWs.onmessage = async (event: MessageEvent) => {
        const data = event.data;
        if (!(data instanceof Blob)) return;

        try {
            const arrayBuffer = await data.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            if (buffer.length === 0) return;

            const trackID = buffer[0];

            // 根据轨道ID处理不同类型的媒体数据
            switch (trackID) {
                case TrackID.MICROPHONE_AUDIO:
                    await handleAudioData(trackID, buffer);
                    break;
                case TrackID.CPA_AUDIO:
                    await handleAudioData(trackID, buffer);
                    break;
                case TrackID.SCREEN_SHARE_VIDEO:
                    await handleVideoData(trackID, buffer);
                    break;
                default:
                    console.warn(`[ws] Unknown track ID: ${trackID}`);
                    break;
            }
        } catch (error) {
            console.error('[ws] Error processing media message:', error);
        }
    }

    // messageWs handlers
    msgWs.onopen = () => {
        console.log('[ws] Message WebSocket connected:', msgWsAddr);

        // initial mirror state in subprocess
        syncMirrorState();
    }

    msgWs.onclose = () => {
        console.log('[ws] Message WebSocket disconnected');
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
            case 'onlinePeers':
                console.log('[ws] onlinePeers', msg);
                break;

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
                // console.log('rtc_status', msg);
                break;
            case "connection_state":
                console.log('connection_state', msg);
                if (msg.state === 'disconnected' || msg.state === 'failed' || msg.state === 'closed') {
                    if (msg.peerIP && typeof msg.peerIP === 'string') {
                        const remoteUsersStore = useRemoteUsersStore.getState();
                        if (remoteUsersStore.peers[msg.peerIP]) {
                            console.log(`[ws] Removing peer ${msg.peerIP} due to connection state: ${msg.state}`);
                            remoteUsersStore.removePeer(msg.peerIP);
                        }
                    }
                }
                break;
            case "BER":
                console.log('BER', msg);
                break;
            case "dm":
                console.log('dm', msg);
                useDMStore.getState().addMessage(msg.from || 'unknown', msg);
                break;
            case "latency":
                // console.log('latency', msg);
                // 将数组格式转换为 Record<string, string> 格式
                const latencyRecord: Record<string, string> = {};
                if (Array.isArray(msg.latencies)) {
                    msg.latencies.forEach((item: any) => {
                        if (item.peerIP && item.latency) {
                            latencyRecord[item.peerIP] = item.latency;
                        }
                    });
                }
                useLatencyStore.getState().updateLatencies(latencyRecord);
                break;
            default:
                console.warn('[ws] Unknown message type:', msg);
                break;
        }
    } catch (err) {
        console.error('[ws] Failed to parse message:', err);
    }
}

const handleAudioData = async (trackID: TrackIDType, buffer: Uint8Array) => {
    const headerSize = 1 + 4; // TrackID (1 byte) + peerIP (4 bytes)
    if (buffer.length <= headerSize) {
        console.warn(`[Audio] Invalid audio data size for track ${trackID}: ${buffer.length}`);
        return;
    }

    const peerIPBytes = buffer.slice(1, 5);
    const peerIP = `${peerIPBytes[0]}.${peerIPBytes[1]}.${peerIPBytes[2]}.${peerIPBytes[3]}`;
    const opusData = buffer.slice(headerSize);

    try {
        const chunk = new EncodedAudioChunk({
            type: 'key', // all key frame for opus chunk
            data: opusData,
            timestamp: performance.now() * 1000, // 使用当前时间戳，单位为微秒
        });

        // if (trackID === TrackID.CPA_AUDIO) {
        //     console.log(`[Audio] Created chunk for track ${trackID} from ${peerIP}, size: ${opusData.length} bytes`);
        // }
        const outputManager = AudioDecoderManager.getInstance();
        outputManager.processAudioChunk(peerIP, trackID, chunk);

    } catch (error) {
        console.error(`[Audio] Failed to create EncodedAudioChunk for track ${trackID} from ${peerIP}:`, error);
    }
}

const handleVideoData = async (trackID: TrackIDType, buffer: Uint8Array) => {
    const headerSize = 1 + 4; // TrackID (1 byte) + peerIP (4 bytes)
    if (buffer.length <= headerSize) {
        console.warn(`[Video] Invalid video data size for track ${trackID}: ${buffer.length}`);
        return;
    }

    const peerIPBytes = buffer.slice(1, 5);
    const peerIP = `${peerIPBytes[0]}.${peerIPBytes[1]}.${peerIPBytes[2]}.${peerIPBytes[3]}`;
    const vp9Data = buffer.slice(headerSize);

    try {
        // VP9 关键帧检测逻辑
        // 检查第一个字节的第 3 位 (frame_type)，0 表示关键帧
        const isKeyFrame = (vp9Data[0] & 0x08) === 0;

        // 创建 EncodedVideoChunk 来解码
        const chunk = new EncodedVideoChunk({
            type: isKeyFrame ? 'key' : 'delta',
            timestamp: performance.now() * 1000, // 转换为微秒
            data: vp9Data
        });

        const outputManager = VideoDecoderManager.getInstance();
        outputManager.processVideoChunk(peerIP, trackID, chunk);
    } catch (error) {
        console.error(`[Video] Failed to create EncodedVideoChunk for track ${trackID} from ${peerIP}:`, error);
    }
}

const initializeWsListener = () => {
    const { initializeWsListener } = useWsStore.getState();
    initializeWsListener();
}

// useWsStore.getState().initializeWsListener();

export { useWsStore, initializeWsListener };
