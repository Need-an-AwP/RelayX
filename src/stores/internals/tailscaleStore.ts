import { create } from 'zustand'
import { isValidIPv4, isValidIPv6 } from '@/utils/ipValidation'
import type { TailscaleStore, TailscaleStatus, PeerData } from '@/types/internals/tailscaleStoreTypes'


const useTailscale = create<TailscaleStore>()(
    (set) => ({
        status: null,
        selfIPs: {},
        isTailscaleAuthKey: false,

        setStatus: (status) => set({ status }),
        setSelfIPs: (ips) => set({ selfIPs: ips }),
        setIsTailscaleAuthKey: (isAuthKey) => set({ isTailscaleAuthKey: isAuthKey })
    })
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
    })
}

export { useTailscale, initializeTailscaleListeners }