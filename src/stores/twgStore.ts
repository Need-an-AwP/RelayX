import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Status, PeerStatus } from '@/types'

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

interface TailscaleState {
    showWelcome: boolean;
    tailscaleStatus: Status | null;
    tsBackendState: TsBackendState | null;
    onlinePeers: onlinePeers | null;
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
        updateTailscaleStatus: (status) => set({ tailscaleStatus: status }),
        updateOnlinePeers: (peers) => set({ onlinePeers: peers }),
        setTsBackendState: (state) => set({ tsBackendState: state }),
        setShowWelcome: (show) => set({ showWelcome: show }),
    }))
)


const initializeTwgListeners = async () => {
    const { updateTailscaleStatus, setTsBackendState } = useTailscaleStore.getState();

    // try get tsBackendState first
    // when refresh page the info will be lost
    window.ipcBridge.invoke('getTsBackendState')
        .then((state: string) => {
            setTsBackendState(state as TsBackendState);
        })

    window.ipcBridge.receive('no-env-file', (message: any) => {
        console.log('no-env-file', message);
        useTailscaleStore.getState().setShowWelcome(true);
    })

    window.ipcBridge.invoke('no-env-file')
        .then((message: any) => {
            if (message !== false) {
                useTailscaleStore.getState().setShowWelcome(true);
            }
        })

    window.ipcBridge.receive('tsBackendState', (message: backendState) => {
        console.log('tsBackendState', message);
        setTsBackendState(message.state as TsBackendState);
    })

    window.ipcBridge.receive('tsStatus', (message: { type: string, status: Status }) => {
        // console.log('tsStatus', message);
        updateTailscaleStatus(message.status);
    })

}

export { initializeTwgListeners, useTailscaleStore, type backendState, type TsBackendState }