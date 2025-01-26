import { create } from 'zustand'
import { isValidIPv4, isValidIPv6 } from '@/utils/ipValidation'
import type { TailscaleStore, TailscaleStatus, PeerData } from '@/types/internals/tailscaleStoreTypes'
import { initializeDB } from '@/stores'
import { initializeChannels } from '@/stores'
import { subscribeWithSelector } from 'zustand/middleware'

const useTailscale = create<TailscaleStore>()(
    subscribeWithSelector((set) => ({
        isInitialized: false,
        status: null,
        selfIPs: {},
        selfID: null,
        networkID: null,
        loginName: null,
        isTailscaleAuthKey: false,

        setIsInitialized: (isInitialized) => set({ isInitialized }),
        setStatus: (status) => set({ status }),
        setSelfIPs: (ips) => set({ selfIPs: ips }),
        setSelfID: (id) => set({ selfID: id }),
        setNetworkID: (id) => set({ networkID: id }),
        setLoginName: (name) => set({ loginName: name }),
        setIsTailscaleAuthKey: (isAuthKey) => set({ isTailscaleAuthKey: isAuthKey })
    }))
)

const initializeTailscaleListeners = () => {
    window.ipcBridge.receive('tailscale-status', (status: TailscaleStatus) => {
        // console.log(status)
        if (!status.TailscaleIPs) return

        const store = useTailscale.getState()
        const selfUserID = status.Self.UserID;
        const filteredStatus: TailscaleStatus = {
            ...status,
            Peer: Object.entries(status.Peer).reduce<Record<string, PeerData>>(
                (acc, [key, peer]) => {
                    if (peer.UserID === selfUserID) {
                        acc[key] = peer;
                    }
                    return acc;
                },
                {}
            )
        };
        store.setStatus(filteredStatus);
        let ipv4, ipv6
        status.TailscaleIPs.map((ip: string) => {

            if (isValidIPv4(ip)) {
                ipv4 = ip
            } else if (isValidIPv6(ip)) {
                ipv6 = ip
            }
        })
        store.setSelfIPs({ ipv4, ipv6 });

        store.setLoginName(status.User?.[status.Self.UserID]?.LoginName);
        store.setSelfID(Number(status.Self.ID));
        store.setNetworkID(status.Self.UserID);

        // init indexedDB after tailscale status has value
        initializeDB();
        // init channel store after tailscale status has value
        initializeChannels();
        // set is initialized to true
        store.setIsInitialized(true);
    })
}

export { useTailscale, initializeTailscaleListeners }