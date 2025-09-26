import { memo, useMemo, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, ContextMenuCheckboxItem } from "@/components/ui/context-menu"
import { useTailscaleStore, useRemoteUsersStore, useLocalUserStateStore } from '@/stores';
import PeerItem from './PeerItem'

const PeersView = () => {
    const [displayOption, setDisplayOption] = useState<"all" | "online" | "users">("all");
    const { tailscaleStatus } = useTailscaleStore()
    const { peers } = useRemoteUsersStore()
    const { userState } = useLocalUserStateStore()

    const sortedPeerEntries = useMemo(() => {
        if (!tailscaleStatus?.Peer) return [];

        return Object.entries(tailscaleStatus.Peer)
            .map(([nodekey, peer]) => ({ nodekey, peer }))
            .filter(({ peer }) => peer)
            .sort((a, b) => {
                const aIP = a.peer?.TailscaleIPs?.[0];
                const bIP = b.peer?.TailscaleIPs?.[0];
                if (!aIP || !bIP) return 0;

                const aHasUser = !!peers[aIP];
                const bHasUser = !!peers[bIP];

                if (aHasUser && !bHasUser) return -1;
                if (!aHasUser && bHasUser) return 1;
                return 0;
            });
    }, [tailscaleStatus?.Peer, peers]);

    const localPeer = useMemo(() => {
        if (!tailscaleStatus?.Self) return null;
        return tailscaleStatus.Self;
    }, [tailscaleStatus?.Self]);

    return (
        <div className="@container flex-1 overflow-auto">
            <ContextMenu>
                <ContextMenuTrigger>
                    <ScrollArea className="h-full w-full">
                        {/* local user and machine */}
                        {localPeer && (
                            <PeerItem 
                                key="local-self" 
                                peerStatus={localPeer} 
                                userState={userState}
                                displayLatency={false}
                            />
                        )}
                        
                        {/* remote peers */}
                        {sortedPeerEntries.map(({ nodekey, peer }) => {
                            if (!peer) return null;
                            if (displayOption === "online" && !peer.Online) return null;

                            const peerIP = peer.TailscaleIPs[0]
                            const userState = peers[peerIP]
                            if (displayOption === "users" && !userState) return null;

                            return <PeerItem key={nodekey} peerStatus={peer} userState={userState} />
                        })}
                    </ScrollArea>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuCheckboxItem
                        checked={displayOption === "online"}
                        onCheckedChange={() => setDisplayOption(displayOption === "online" ? "all" : "online")}
                    >
                        Only display online machines
                    </ContextMenuCheckboxItem>
                    <ContextMenuCheckboxItem
                        checked={displayOption === "users"}
                        onCheckedChange={() => setDisplayOption(displayOption === "users" ? "all" : "users")}
                    >
                        Only display users
                    </ContextMenuCheckboxItem>
                </ContextMenuContent>
            </ContextMenu>
        </div>
    )
}

export default PeersView