import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'


export interface PeerState {
    userName: string
    userAvatar: string
    isSelf: boolean
    isInChat: boolean
    isInputMuted: boolean
    isOutputMuted: boolean
    isSharingScreen: boolean
    isSharingAudio: boolean
}

export interface PeerLatency {
    latency: number
    lastPingTime: number
}

export const PeerStateKeys = [
    'userName', 'userAvatar', 'isSelf', 'isInChat',
    'isInputMuted', 'isOutputMuted', 'isSharingScreen', 'isSharingAudio'
] as const;

export type peerIP = string;
export type peerID = string;
export type peerMap = Record<peerIP, PeerState>
export type peerLatencyMap = Record<peerIP, PeerLatency>

interface PeerStateStore {
    peers: peerMap
    peerLatencies: peerLatencyMap
    selfState: PeerState
    initialized: boolean
    addPeer: (peerIP: peerIP) => void
    updatePeerState: (peerID: peerID, partialState: Partial<Omit<PeerState, 'peerID'>>) => void
    getPeerState: (peerID: peerID) => PeerState | undefined
    updatePeerLatency: (peerIP: peerIP, partialLatency: Partial<PeerLatency>) => void
    getPeerLatency: (peerIP: peerIP) => PeerLatency | undefined
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
}

const defaultPeerLatency: PeerLatency = {
    latency: -1,
    lastPingTime: 0,
}

export const usePeerStateStore = create<PeerStateStore>()(
    subscribeWithSelector(
        immer((set, get) => ({
            peers: {},
            peerLatencies: {},
            selfState: { ...defaultPeerState, isSelf: true },
            initialized: false,

            initializeSelfState: async () => {
                try {
                    const userConfig = await window.ipcBridge.getUserConfig();
                    set((state) => {
                        if (userConfig.userName !== undefined) {
                            state.selfState.userName = userConfig.userName;
                        }
                        if (userConfig.userAvatar !== undefined) {
                            state.selfState.userAvatar = userConfig.userAvatar;
                        }
                        state.initialized = true;
                    });
                } catch (error) {
                    console.error('Failed to load user config:', error);
                    set((state) => {
                        state.initialized = true;
                    });
                }
            },

            updateSelfState: (partialState: Partial<PeerState>) => {
                try {
                    if (partialState.userName !== undefined) {
                        window.ipcBridge.setUserConfig('userName', partialState.userName);
                    }
                    if (partialState.userAvatar !== undefined) {
                        window.ipcBridge.setUserConfig('userAvatar', partialState.userAvatar);
                    }

                    set((state) => {
                        Object.assign(state.selfState, partialState);
                    });
                } catch (error) {
                    console.error('Failed to update user config:', error);
                }
            },

            addPeer: (peerIP: string) => {
                set((state) => {
                    state.peers[peerIP] = { ...defaultPeerState };
                    state.peerLatencies[peerIP] = { ...defaultPeerLatency };
                });
            },

            updatePeerState: (peerIP: string, partialState: Partial<Omit<PeerState, 'peerIP'>>) => {
                set((state) => {
                    if (!state.peers[peerIP]) {
                        state.peers[peerIP] = { ...defaultPeerState, ...partialState };
                    } else {
                        Object.assign(state.peers[peerIP], partialState);
                    }
                });
            },

            getPeerState: (peerIP: string) => {
                return get().peers[peerIP];
            },

            updatePeerLatency: (peerIP: string, partialLatency: Partial<PeerLatency>) => {
                set((state) => {
                    if (!state.peerLatencies[peerIP]) {
                        state.peerLatencies[peerIP] = { ...defaultPeerLatency };
                    }
                    Object.assign(state.peerLatencies[peerIP], partialLatency);
                });
            },

            getPeerLatency: (peerIP: string) => {
                return get().peerLatencies[peerIP];
            },

            getSelfState: () => {
                return get().selfState;
            }
        }))
    )
);

// 自动初始化用户配置
usePeerStateStore.getState().initializeSelfState();
