import { create } from 'zustand'
import { useChannel, useCurrentUser, useTailscale } from '@/stores'
import type { CurrentChannelStore } from "@/types"


// this is an middleware for making get users from current channel easier
export const useCurrentChannel = create<CurrentChannelStore>()(
    (set, get) => {
        const updateState = () => {
            const currentChannel = useCurrentUser.getState().inVoiceChannel
            const selfIPv4 = useTailscale.getState().selfIPs.ipv4

            if (!currentChannel) {
                set({
                    currentChannel: null,
                    allUsers: [],
                    remoteUsers: [],
                    localUser: null
                })
                return
            }

            const channelUsers = useChannel.getState().users[currentChannel.id] || []
            const localUser = channelUsers.find(user => user.IPs.ipv4 === selfIPv4) || null
            const remoteUsers = channelUsers.filter(user => user.IPs.ipv4 !== selfIPv4)

            set({
                currentChannel,
                allUsers: channelUsers,
                remoteUsers,
                localUser
            })
        }

        // 订阅相关store的变化
        useCurrentUser.subscribe(
            state => state.inVoiceChannel,
            () => updateState()
        )

        useChannel.subscribe(
            state => state.users,
            () => updateState()
        )

        return {
            currentChannel: null,
            allUsers: [],
            remoteUsers: [],
            localUser: null,

            isUserInChannel: (userId: number) => {
                return get().allUsers.some(user => user.id === userId)
            },

            getRemoteUserByIP: (ipv4: string) => {
                return get().remoteUsers.find(user => user.IPs.ipv4 === ipv4)
            }
        }
    }
)