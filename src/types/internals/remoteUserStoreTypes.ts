import type { UserConfig } from "./DBStoreTypes";
import type { MirrorState } from '@/stores/mirrorStates'

export type remoteUserInfo = MirrorState

export interface RemoteUserState {
    userConfigs: Map<string, UserConfig>;
    remoteUsersInfo: Map<string, remoteUserInfo>;

    updateRemoteUsersInfo: (tailscaleIP: string, userInfo: remoteUserInfo) => void;
    setUser: (tailscaleIP: string, config: UserConfig) => void;
    removeUser: (tailscaleIP: string) => void;
    getUser: (tailscaleIP: string) => UserConfig | undefined;
    getAllUsers: () => Map<string, UserConfig>;
    clear: () => void;
}