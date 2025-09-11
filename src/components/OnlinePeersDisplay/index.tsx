import { useTailscaleStore } from '@/stores';
import { LoaderCircle } from "lucide-react";
import PeersView from './PeersView';

export default function OnlinePeersDisplay() {
    const { tailscaleStatus } = useTailscaleStore()

    if (!tailscaleStatus) {
        return (
            <div className="p-2 h-full flex items-center justify-center gap-2">
                <LoaderCircle className="w-4 h-4 animate-spin" /><p className="text-sm text-muted-foreground">Waiting for peers info...</p>
            </div>
        );
    } else if (Object.keys(tailscaleStatus.Peer).length === 0) {
        return (
            <div className="p-2 h-full flex items-center justify-center gap-2">
                <p className="text-sm text-muted-foreground">🤔 There is no machine in this tsnet</p>
            </div>
        );
    } else {
        return (
            <div className="h-full flex flex-col py-2 overflow-hidden">
                <div className="flex-1 overflow-hidden flex flex-col">
                    <PeersView />
                </div>
            </div>
        );
    }
}