import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface PeerState {
    userName: string
    userAvatar: string
    isInChat: boolean
    isInputMuted: boolean
    isOutputMuted: boolean
    isSharingScreen: boolean
    isSharingAudio: boolean
}

const defaultPeerState: PeerState = {
    // storage state
    userName: 'userName',
    userAvatar: 'https://github.com/evilrabbit.png',
    // temporary state
    isInChat: false,
    isInputMuted: false,
    isOutputMuted: false,
    isSharingScreen: false,
    isSharingAudio: false,
}

interface LocalUserStateStore {
    userState: PeerState
    initialized: boolean
    initializeSelfState: () => Promise<void>
    updateSelfState: (partialState: Partial<PeerState>) => void
}

export const useLocalUserStateStore = create<LocalUserStateStore>()(
    immer((set, get) => ({
        userState: defaultPeerState,
        initialized: false,
        initializeSelfState: async () => {
            try {
                const userConfig = await window.ipcBridge.getUserConfig();
                set((state) => {
                    if (userConfig.userName !== undefined) {
                        state.userState.userName = userConfig.userName;
                    }
                    if (userConfig.userAvatar !== undefined) {
                        state.userState.userAvatar = userConfig.userAvatar;
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
                // for all state
                set((state) => {
                    Object.assign(state.userState, partialState);
                });
            } catch (error) {
                console.error('Failed to update user config:', error);
            }
        },
    }))
)
