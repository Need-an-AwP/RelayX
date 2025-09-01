import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Status, PeerStatus } from '@/types'

type onlinePeersNodeInfo = {
    hostname: string;
    random_id: number;
    start_time: number;
    tailscale_ip: string;
}

interface onlinePeers {
    [key: string]: {
        node_info: onlinePeersNodeInfo,
        timestamp: number
    }
}

interface OnlinePeersState {
    peers: { [key: string]: string }// key is ipv4 peerIP, value is nodekey
    updateOnlinePeers: (peerIPs: string[]) => void
}

const useOnlinePeersStore = create<OnlinePeersState>((set) => ({
    peers: {},
    updateOnlinePeers: (peerIPs) => {
        const { tailscaleStatus } = useTailscaleStore.getState();

        if (!tailscaleStatus?.Peer) {
            console.warn('No Tailscale peer data available');
            return;
        }

        const newPeers: { [key: string]: string } = {};

        peerIPs.forEach(peerIP => {
            Object.entries(tailscaleStatus.Peer).forEach(([nodekey, peerStatus]) => {
                const peer = peerStatus as PeerStatus;
                if (peer && peer.TailscaleIPs) {
                    const hasMatchingIP = peer.TailscaleIPs.some((ip: string) => {
                        return ip === peerIP
                    });

                    if (hasMatchingIP) {
                        newPeers[peerIP] = nodekey;
                    }
                }
            });
        });

        set({ peers: newPeers });
    }
}));


interface backendState {
    type: string;
    tsBackendState: string;
    timestamp: number;
}

interface TailscaleState {
    showWelcome: boolean;
    tailscaleStatus: Status | null;
    onlinePeers: onlinePeers | null;
    updateTailscaleStatus: (status: Status) => void;
    updateOnlinePeers: (peers: onlinePeers) => void;
}

const useTailscaleStore = create<TailscaleState>()(
    subscribeWithSelector((set) => ({
        showWelcome: false,
        tailscaleStatus: null,
        onlinePeers: null,
        updateTailscaleStatus: (status) => set({ tailscaleStatus: status }),
        updateOnlinePeers: (peers) => set({ onlinePeers: peers }),
    }))
)


const initializeTwgListeners = () => {
    const { updateTailscaleStatus, updateOnlinePeers } = useTailscaleStore.getState();

    window.ipcBridge.receive('no-env-file', (message: any) => {
        console.log('no-env-file', message);
        useTailscaleStore.setState({ showWelcome: true });
    })

    window.ipcBridge.receive('tsBackendState', (message: backendState) => {
        console.log('tsBackendState', message);
    })

    window.ipcBridge.receive('tsStatus', (message: { type: string, status: Status }) => {
        console.log('tsStatus', message);
        updateTailscaleStatus(message.status);
    })

    window.ipcBridge.receive('onlinePeers', (message: { type: string, peers: onlinePeers }) => {
        console.log('onlinePeers', message);
        updateOnlinePeers(message.peers);
    })
}

export { initializeTwgListeners, useTailscaleStore }