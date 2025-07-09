import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'


export interface PeerState {
    userName: string
    userAvatar: string
    isSelf: boolean
    isInChat: boolean
    isInputMuted: boolean
    isOutputMuted: boolean
    isSharingScreen: boolean
    isSharingAudio: boolean
    latency: number
    lastPingTime: number
}

export const PeerStateKeys = [
    'userName', 'userAvatar', 'isSelf', 'isInChat',
    'isInputMuted', 'isOutputMuted', 'isSharingScreen', 'isSharingAudio'
] as const;

export type peerIP = string;
export type peerID = string;
export type peerMap = Map<peerIP, PeerState>

interface PeerStateStore {
    peers: peerMap
    selfState: PeerState
    initialized: boolean
    addPeer: (peerIP: peerIP) => void
    updatePeerState: (peerID: peerID, partialState: Partial<Omit<PeerState, 'peerID'>>) => void
    setPeerState: (peerID: peerID, state: PeerState) => void
    getPeerState: (peerID: peerID) => PeerState | undefined
    initializeSelfState: () => Promise<void>
    updateSelfState: (partialState: Partial<PeerState>) => void
}

const defaultPeerState: PeerState = {
    userName: 'userName',
    userAvatar: 'https://github.com/evilrabbit.png',
    isSelf: false,
    isInChat: false,
    isInputMuted: false,
    isOutputMuted: false,
    isSharingScreen: false,
    isSharingAudio: false,
    latency: -1,
    lastPingTime: 0,
}

export const usePeerStateStore = create<PeerStateStore>()(
    subscribeWithSelector((set, get) => ({
        peers: new Map(),
        selfState: { ...defaultPeerState, isSelf: true },
        initialized: false,

        initializeSelfState: async () => {
            try {
                const userConfig = await window.ipcBridge.getUserConfig();
                set((state) => ({
                    ...state,
                    selfState: {
                        ...state.selfState,
                        ...(userConfig.userName !== undefined ? { userName: userConfig.userName } : {}),
                        ...(userConfig.userAvatar !== undefined ? { userAvatar: userConfig.userAvatar } : {})
                    }
                }));
            } catch (error) {
                console.error('Failed to load user config:', error);
            }
            set({ initialized: true })
        },

        updateSelfState: (partialState: Partial<PeerState>) => {
            try {
                if (partialState.userName !== undefined) {
                    window.ipcBridge.setUserConfig('userName', partialState.userName);
                }
                if (partialState.userAvatar !== undefined) {
                    window.ipcBridge.setUserConfig('userAvatar', partialState.userAvatar);
                }

                set((state) => ({
                    ...state,
                    selfState: {
                        ...state.selfState,
                        ...partialState
                    }
                }));
            } catch (error) {
                console.error('Failed to update user config:', error);
            }
        },

        addPeer: (peerIP: string) => {
            set((state) => ({
                ...state,
                peers: new Map(state.peers).set(peerIP, defaultPeerState)
            }))
        },

        updatePeerState: (peerIP: string, partialState: Partial<Omit<PeerState, 'peerIP'>>) => {
            set((state) => {
                const peer = state.peers.get(peerIP);
                if (!peer) {
                    const updatedPeer = { ...defaultPeerState, ...partialState };
                    const newPeers = new Map(state.peers);
                    newPeers.set(peerIP, updatedPeer);
                    return { peers: newPeers };
                }
                const updatedPeer = { ...peer, ...partialState };
                const newPeers = new Map(state.peers);
                newPeers.set(peerIP, updatedPeer);
                return { ...state, peers: newPeers };
            });
        },

        setPeerState: (peerIP: string, state: PeerState) => {
            set((currentState) => {
                const newPeers = new Map(currentState.peers);
                newPeers.set(peerIP, state);
                return { ...currentState, peers: newPeers };
            });
        },

        getPeerState: (peerIP: string) => {
            return get().peers.get(peerIP);
        },

        getSelfState: () => {
            return get().selfState;
        }
    }))
);

// 自动初始化用户配置
usePeerStateStore.getState().initializeSelfState();
