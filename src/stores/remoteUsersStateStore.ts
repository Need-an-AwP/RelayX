import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware'
import type { PeerState } from '@/types';

interface RemoteUsersState {
    peers: Record<string, PeerState>
    removePeer: (peerIP: string) => void
    updatePeerState: (peerIP: string, peerState: PeerState) => void
}

const useRemoteUsersStore = create<RemoteUsersState>()(
    subscribeWithSelector((set, get) => ({
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
)

export { useRemoteUsersStore };
