import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Status, PeerStatus } from '@/types'
import { useWelcomeStore } from './welcomeStore'

/**
 * BackendState is an ipn.State string value:
 * "NoState", "NeedsLogin", "NeedsMachineAuth", "Stopped",
 * "Starting", "Running".
 */
type TsBackendState =
    | "NoState"
    | "NeedsLogin"
    | "NeedsMachineAuth"
    | "Stopped"
    | "Starting"
    | "Running"

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

interface backendState {
    type: string;
    state: string;
    timestamp: number;
}

interface connectionMode {
    type: "Direct" | "Relay" | "PeerRelay" | "NotConnected";
    info: string;
}

interface TailscaleState {
    showWelcome: boolean;
    tailscaleStatus: Status | null;
    tsBackendState: TsBackendState | null;
    onlinePeers: onlinePeers | null;
    connectionModes: Record<string, connectionMode> | null;// key is peerIP
    updateTailscaleStatus: (status: Status) => void;
    updateOnlinePeers: (peers: onlinePeers) => void;
    setTsBackendState: (state: TsBackendState | null) => void;
    setShowWelcome: (show: boolean) => void;
}

const useTailscaleStore = create<TailscaleState>()(
    subscribeWithSelector((set) => ({
        showWelcome: false,
        tailscaleStatus: null,
        tsBackendState: null,
        onlinePeers: null,// udp broadcasted online clients
        connectionModes: null,
        updateTailscaleStatus: (status) => {
            const connectionModes: Record<string, connectionMode> = {};

            if (status?.Peer) {
                Object.entries(status.Peer).forEach(([peerKey, peerStatus]) => {
                    if (!peerStatus) return;

                    const peerIP = peerStatus.TailscaleIPs?.[0] || peerKey;
                    const curAddr = peerStatus.CurAddr || '';
                    const relay = peerStatus.Relay || '';
                    const peerRelay = peerStatus.PeerRelay || '';

                    let connectionMode: connectionMode;
                    if (curAddr && curAddr.trim() !== '') {
                        connectionMode = { type: 'Direct', info: curAddr };
                    } else if (peerRelay && peerRelay.trim() !== '') {
                        connectionMode = { type: 'PeerRelay', info: peerRelay };
                    } else if (relay && relay.trim() !== '') {
                        connectionMode = { type: 'Relay', info: relay };
                    } else {
                        connectionMode = { type: 'NotConnected', info: '' };
                    }

                    connectionModes[peerIP] = connectionMode;
                });
            }

            set({
                tailscaleStatus: status,
                connectionModes: connectionModes
            });
        },
        updateOnlinePeers: (peers) => set({ onlinePeers: peers }),
        setTsBackendState: (state) => set({ tsBackendState: state }),
        setShowWelcome: (show) => set({ showWelcome: show }),
    }))
)


const initializeTwgListeners = async () => {
    const { updateTailscaleStatus, setTsBackendState, setShowWelcome } = useTailscaleStore.getState();

    // try get tsBackendState first
    // when refresh page the info will be lost
    window.ipcBridge.invoke('getTsBackendState')
        .then((state: string) => {
            setTsBackendState(state as TsBackendState);
        })

    window.ipcBridge.receive('show-welcome', (message: any) => {
        console.log('show-welcome', message);
        useTailscaleStore.getState().setShowWelcome(message !== false ? true : false);
    })

    window.ipcBridge.invoke('show-welcome')
        .then((message: any) => {
            console.log('show-welcome', message);
            useTailscaleStore.getState().setShowWelcome(message !== false ? true : false);
        })

    window.ipcBridge.receive('tsBackendState', (message: backendState) => {
        console.log('tsBackendState', message);
        setTsBackendState(message.state as TsBackendState);
        if (message.state === 'Starting') {
            setShowWelcome(false);
            useWelcomeStore.getState().setIsVarifyingKey(false);
        }
    })

    window.ipcBridge.receive('tsError', (message: any) => {
        console.log('tsError', message);
        useWelcomeStore.getState().setIsInvalidKey(true);
        useWelcomeStore.getState().setIsVarifyingKey(false);
    })

    window.ipcBridge.receive('tsStatus', (message: { type: string, status: Status }) => {
        // console.log('tsStatus', message);
        updateTailscaleStatus(message.status);
    })

}

export { initializeTwgListeners, useTailscaleStore, type backendState, type TsBackendState, type connectionMode }