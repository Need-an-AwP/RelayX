import type { IPs } from "@/types";

export type BaseChannel = {
    id: number;
    name: string;
}

export type TextChannel = BaseChannel & {
    type: 'text';
}

export type VoiceChannel = BaseChannel & {
    type: 'voice';
}

export type Channel = TextChannel | VoiceChannel

export type User = {
    id: number;
    name: string;
    avatar: string;
    IPs: IPs;
}

export interface currentUser {
    activeChannel: Channel;
}

export interface ChannelState {
    isInitialized: boolean;
    channels: Channel[];
    fetchLoding: boolean;
    isPresetChannels: boolean;

    users: {
       [channelId: number]: User[]; 
    };

}

export interface ChannelActions {
    setChannels: (channels: Channel[]) => void;
    setIsInitialized: (value: boolean) => void;
    setFetchLoding: (value: boolean) => void;
    setIsPresetChannels: (value: boolean) => void;
    setUsers: (users: Record<number, User[]>) => void;
    removeUser: (channelId: number, userId: number) => void;
    addUser: (channelId: number, user: User) => void;
}

export type ChannelStore = ChannelState & ChannelActions;