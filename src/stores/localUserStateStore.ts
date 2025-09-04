import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useWsStore } from './wsStore'
import type { PeerState } from '@/types'


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
    initializeSelfState: () => Promise<void>// the init method is called in userProfile component
    updateSelfState: (partialState: Partial<PeerState>) => void
}

const useLocalUserStateStore = create<LocalUserStateStore>()(
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

            syncMirrorState(get().userState);
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

                syncMirrorState(get().userState);
            } catch (error) {
                console.error('Failed to update user config:', error);
            }
        },
    }))
)

const syncMirrorState = (userState: PeerState) => {
    const { sendMsg } = useWsStore.getState();
    if (!sendMsg) return;

    sendMsg({ type: "mirrorLocalState", userState });
}

const broadcastLocalUserState = (userState: PeerState) => {
    const { sendMsg } = useWsStore.getState();
    if (!sendMsg) return;

    sendMsg({ type: "userState", userState });
}

export { useLocalUserStateStore };