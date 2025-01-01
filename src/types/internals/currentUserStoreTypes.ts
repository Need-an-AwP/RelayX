import type { Channel, User } from "./channelsStoreTypes";

export interface CurrentUserStore {
    inVoiceChannel: Channel | null;
    isScreenSharing: boolean;
    isMuted: boolean;
    isDeafened: boolean;
    customStatus: string | null;
    user: User | null;
    isPresetChannels: boolean;

    setInVoiceChannel: (inVoiceChannel: Channel | null) => void;
    setIsScreenSharing: (isScreenSharing: boolean) => void;
    setIsMuted: (isMuted: boolean) => void;
    setIsDeafened: (isDeafened: boolean) => void;
    setCustomStatus: (customStatus: string | null) => void;
    setUser: (user: User | null) => void;
    setIsPresetChannels: (isPresetChannels: boolean) => void;
}
