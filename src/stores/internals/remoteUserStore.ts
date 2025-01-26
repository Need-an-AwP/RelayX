import { create } from 'zustand'
import type { RemoteUserState } from '@/types'
import type { MirrorState } from '@/stores/mirrorStates'


export const useRemoteUserStore = create<RemoteUserState>()(
    (set, get) => ({
        userConfigs: new Map(),
        remoteUsersInfo: new Map(),

        updateRemoteUsersInfo: (tailscaleIP: string, userInfo: MirrorState) => {
            // console.log('Updating remote user info:', { tailscaleIP, userInfo });
            set((state) => {
                const newRemoteUsersInfo = new Map(state.remoteUsersInfo);
                newRemoteUsersInfo.set(tailscaleIP, userInfo);
                return { remoteUsersInfo: newRemoteUsersInfo };
            });
        },

        setUser: (tailscaleIP, config) => {
            set((state) => {
                const newUsers = new Map(state.userConfigs)
                newUsers.set(tailscaleIP, config)
                return { userConfigs: newUsers }
            })
        },
        removeUser: (tailscaleIP) => {
            set((state) => {
                const newUsers = new Map(state.userConfigs)
                newUsers.delete(tailscaleIP)
                return { userConfigs: newUsers }
            })
        },
        getUser: (tailscaleIP) => {
            return get().userConfigs.get(tailscaleIP)
        },
        getAllUsers: () => {
            return get().userConfigs
        },
        clear: () => {
            set({ userConfigs: new Map() })
        }
    })
)
