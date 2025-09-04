import { create } from 'zustand';
import type { PeerState } from '@/types';

interface RemoteUsersState {
    peers: Record<string, PeerState>
    removePeer: (peerIP: string) => void
    updatePeerState: (peerIP: string, peerState: PeerState) => void
}

const useRemoteUsersStore = create<RemoteUsersState>()((set, get) => ({
    peers: {},

    removePeer: (peerIP: string) => {
        set((state) => {
            const { [peerIP]: removed, ...rest } = state.peers;
            return { peers: rest };
        });
    },

    updatePeerState: (peerIP: string, peerState: PeerState) => {
        console.log('Updating peer state:', peerIP, peerState);
        set((state) => ({
            peers: {
                ...state.peers,
                [peerIP]: peerState,
            }
        }));
    },
}))

export { useRemoteUsersStore };
