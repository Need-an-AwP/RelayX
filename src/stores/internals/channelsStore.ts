import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ChannelStore, User } from '@/types'
import { useTailscale } from '@/stores'
import fetchChannels from '@/utils/requestChannels'


export const useChannel = create<ChannelStore>()(
    subscribeWithSelector((set) => ({
        isInitialized: false,
        fetchLoding: false,
        isPresetChannels: false,
        channels: [],
        users: {},

        setIsInitialized: (value) => set({ isInitialized: value }),
        setFetchLoding: (value) => set({ fetchLoding: value }),
        setIsPresetChannels: (value) => set({ isPresetChannels: value }),
        setChannels: (channels) => set({ channels: channels }),
        addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
        removeChannel: (channelId) => set((state) => ({ channels: state.channels.filter(c => c.id !== channelId) })),
        setUsers: (users) => set({ users }),
        removeUser: (channelId, userId) => set((state) => {
            const newUsers = { ...state.users }
            newUsers[channelId] = state.users[channelId].filter(u => u.id !== userId)
            return { users: newUsers }
        }),
        addUser: (channelId, user) => set((state) => {
            const newUsers = { ...state.users }
            newUsers[channelId] = [...(state.users[channelId] || []), user]
            return { users: newUsers }
        }),
    }))
)

export const initializeChannels = async () => {
    const { loginName } = useTailscale.getState();
    if (!loginName) return null;

    const store = useChannel.getState();
    if (store.isInitialized || store.fetchLoding) return null;

    store.setFetchLoding(true);
    try {
        const { channels, isPreset } = await fetchChannels(loginName);
        store.setIsPresetChannels(isPreset);
        store.setChannels(channels);
        const emptyUsers = channels.reduce((acc, channel) => {
            acc[channel.id] = []
            return acc
        }, {} as Record<number, User[]>);
        store.setUsers(emptyUsers);
        store.setIsInitialized(true);
    } finally {
        store.setFetchLoding(false);
    }
}

