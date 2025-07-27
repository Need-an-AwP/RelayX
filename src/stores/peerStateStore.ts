/*
PeerStateStore is the core of many components
using immer to update
latency state is separated into another store to avoid immer's performance issue
cause immer will create a new reference to the top
which will cause rerender even if component only subscribe part of the state
*/


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

interface PeerStateStore {
    peers: peerMap
    selfState: PeerState
    initialized: boolean
    addPeer: (peerIP: peerIP) => void
    removePeer: (peerID: peerID) => void
    updatePeerState: (peerID: peerID, partialState: Partial<Omit<PeerState, 'peerID'>>) => void
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
}

export const usePeerStateStore = create<PeerStateStore>()(
    subscribeWithSelector(
        immer((set, get) => ({
            peers: {},
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
                    // for status should be save to local storage
                    if (partialState.userName !== undefined) {
                        window.ipcBridge.setUserConfig('userName', partialState.userName);
                    }
                    if (partialState.userAvatar !== undefined) {
                        window.ipcBridge.setUserConfig('userAvatar', partialState.userAvatar);
                    }
                    // for temporary state
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
                });
            },

            removePeer: (peerIP: string) => {
                set((state) => {
                    delete state.peers[peerIP];
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

            getSelfState: () => {
                return get().selfState;
            }
        }))
    )
);


interface PeerLatencyStore {
    latencies: Record<peerIP, PeerLatency>
    updateLatency: (peerIP: peerIP, partialLatency: Partial<PeerLatency>) => void
    getLatency: (peerIP: peerIP) => PeerLatency | undefined
}

const defaultLatency: PeerLatency = {
    latency: -1,
    lastPingTime: 0,
}

export const usePeerLatencyStore = create<PeerLatencyStore>()(
    subscribeWithSelector((set, get) => ({
        latencies: {},

        updateLatency: (peerIP: string, partialLatency: Partial<PeerLatency>) => {
            set((state) => {
                const currentLatency = state.latencies[peerIP] || { ...defaultLatency }
                return {
                    ...state,
                    latencies: {
                        ...state.latencies,
                        [peerIP]: { ...currentLatency, ...partialLatency }
                    }
                }
            })
        },

        getLatency: (peerIP: string) => {
            return get().latencies[peerIP]
        },
    }))
)

// 自动初始化用户配置
usePeerStateStore.getState().initializeSelfState();
