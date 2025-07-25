import { useOnlinePeersStore } from '@/stores';
import PeersView from './PeersView';

export default function OnlinePeersDisplay() {
    const peers = useOnlinePeersStore((state) => state.peers);
    const refreshTime = useOnlinePeersStore((state) => state.refreshTime);

    if (refreshTime === 0 && Object.keys(peers).length === 0) {
        return (
            <div className="p-2 h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Waiting for peers info...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col py-2 overflow-hidden">

            <div className="flex-1 overflow-hidden flex flex-col">
                <PeersView />
            </div>
        </div>
    );
}