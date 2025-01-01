import { create } from 'zustand'
import type { Channel, User } from '@/types'

// channels states is not included
export interface MirrorState {
    user: User | null;
    isPresetChannels: boolean;
    inVoiceChannel: Channel | null;
    isScreenSharing: boolean;
    isMuted: boolean;
    isDeafened: boolean;
    customStatus: string | null;

}

// all mirror states should not trigger re-sync in receiver
// so any commom states between peers should not be included

export const useMirror = create<MirrorState>()(
    (set, get) => ({
        user: null,
        isPresetChannels: false,
        inVoiceChannel: null,
        isScreenSharing: false,
        isMuted: false,
        isDeafened: false,
        customStatus: null,

        // no set methods for components use
    })
)
