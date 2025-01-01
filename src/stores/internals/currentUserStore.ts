import { create } from 'zustand'
import type { CurrentUserStore, Channel, User } from '@/types'
import { subscribeWithSelector } from 'zustand/middleware'


export const useCurrentUser = create<CurrentUserStore>()(
    subscribeWithSelector((set, get) => ({
        inVoiceChannel: null,
        isScreenSharing: false,
        isMuted: false,
        isDeafened: false,
        customStatus: null,
        user: null,
        isPresetChannels: false,

        setInVoiceChannel: (inVoiceChannel: Channel | null) => set({ inVoiceChannel }),
        setIsScreenSharing: (isScreenSharing: boolean) => set({ isScreenSharing }),
        setIsMuted: (isMuted: boolean) => set({ isMuted }),
        setIsDeafened: (isDeafened: boolean) => set({ isDeafened }),
        setCustomStatus: (customStatus: string | null) => set({ customStatus }),
        setUser: (user: User | null) => set({ user }),
        setIsPresetChannels: (isPresetChannels: boolean) => set({ isPresetChannels }),
    }))
)
