import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Status, PeerStatus } from '@/types'
import { useRTCStore } from './rtcStore'

// 定义 "onlinePeers" 事件的核心数据结构
interface OnlinePeersEventPayload {
    refreshTime: number;
    peers: { [key: string]: PeerStatus }; // key 是 peerID
}

// 定义 "accessibility" 事件传递的数据结构
interface AccessibilityPayload {
    peerID: string;
    peerIP: string;
    character: "OFFER" | "ANSWER" | "NONE"; // 更精确的类型
}

// 定义 store 的 state 结构
interface OnlinePeersState extends OnlinePeersEventPayload {
    characters: { [key: string]: "OFFER" | "ANSWER" | "NONE" }; // key 是 peerID
    updateOnlinePeers: (data: OnlinePeersEventPayload) => void;
    updateCharacter: (data: AccessibilityPayload) => void; // 更新签名
}

// "onlinePeers" IPC 消息的完整结构
interface OnlinePeersIPCMessage extends OnlinePeersEventPayload {
    type: "onlinePeers"; // 更精确的类型，如果这个监听器只处理 'onlinePeers'
}

// "accessibility" IPC 消息的完整结构
interface AccessibilityIPCMessage extends AccessibilityPayload {
    type: "accessibility";
}

const useOnlinePeersStore = create<OnlinePeersState>((set) => ({
    refreshTime: 0,
    peers: {}, // key 是 peerID
    characters: {}, // key 是 peerID
    updateOnlinePeers: (data) => set(() => ({
        refreshTime: data.refreshTime,
        peers: data.peers,
    })),
    updateCharacter: (data) => set((state) => ({
        characters: {
            ...state.characters, // 展开旧的 characters 状态
            [data.peerID]: data.character, // 设置或更新指定 peerID 的 character
        }
    }))
}));

interface TailscaleState {
    tailscaleStatus: Status | null;
    updateTailscaleStatus: (status: Status) => void;
}

const useTailscaleStore = create<TailscaleState>()(
    subscribeWithSelector((set) => ({
        tailscaleStatus: null,
        updateTailscaleStatus: (status) => set({ tailscaleStatus: status }),
    }))
)

const initializeTailscaleListeners = () => {
    const { updateOnlinePeers, updateCharacter } = useOnlinePeersStore.getState();
    const { updateTailscaleStatus } = useTailscaleStore.getState();

    window.ipcBridge.receive('tailscaleInfo', (message: { type: string, status: Status }) => {
        // console.log("Received tailscaleInfo:", message)
        updateTailscaleStatus(message.status);
    })

    window.ipcBridge.receive('onlinePeers', (message: OnlinePeersIPCMessage) => {
        if (message.type === "onlinePeers") {
            // console.log("Received onlinePeers message:", message);
            updateOnlinePeers(message);
        }
    })

    window.ipcBridge.receive('accessibility', (message: AccessibilityIPCMessage) => {
        if (message.type === "accessibility") {
            if (message.character === "NONE") return;
            // console.log("Received accessibility message:", message);

            updateCharacter({ peerID: message.peerID, peerIP: message.peerIP, character: message.character });
            const { manager, createConnection } = useRTCStore.getState();
            if (message.character === "OFFER") {
                createConnection(message.peerID, message.peerIP, true); // isOffer = true
            } else if (message.character === "ANSWER") {
                if (!manager.RTCconnections.has(message.peerID)) {
                    // create answer sdp when receiving offer
                    console.log(`Answer side for peer ${message.peerID} (${message.peerIP}) - will create connection when offer received`);
                }
            }
        }
    })
}

export { initializeTailscaleListeners, useOnlinePeersStore, useTailscaleStore }