// called in App.tsx
import { useDB, useTailscale, useCurrentUser, useChannel } from "./index";
import type { UserConfig, User } from '@/types'
import type { MirrorState } from "./mirrorStates";

const createUserFromConfig = (config: UserConfig): User => ({
    id: useTailscale.getState().selfID!,
    name: config.user_name,
    avatar: config.user_avatar,
    IPs: useTailscale.getState().selfIPs
})

// sync User in useCurrentUser from useDB.selfConfig
useDB.subscribe(
    (state) => state.selfConfig,
    (selfConfig) => {
        if (!selfConfig) return;

        useCurrentUser.setState({
            user: createUserFromConfig(selfConfig)
        })
    }
)

import { useMirror } from "./mirrorStates";
import { debounce } from 'lodash';
const updateMirrorwithDebounce = debounce((updates: Partial<MirrorState>) => {
    useMirror.setState(updates);
}, 5);
// sync all necessary states to mirrorStates
useCurrentUser.subscribe(
    (state) => ({
        user: state.user,
        inVoiceChannel: state.inVoiceChannel,
        isScreenSharing: state.isScreenSharing,
        isMuted: state.isMuted,
        isDeafened: state.isDeafened,
        customStatus: state.customStatus,
    }),
    (status) => {
        useMirror.setState(status);
        // console.log('sync state with useCurrentUser', status);
        // updateMirrorwithDebounce(status);
    }
)
// to prevent unecessary sync operations
// only subscribe mirror store needs states
useChannel.subscribe(
    (state) => ({
        isPresetChannels: state.isPresetChannels
    }),
    (status) => {
        // useMirror.setState(status);
        updateMirrorwithDebounce(status);
    }
)