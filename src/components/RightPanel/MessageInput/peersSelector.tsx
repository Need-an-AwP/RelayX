import { usePeerStateStore } from "@/stores";
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PeersSelectorProps {
    targetPeers: string[];
    onPeerChange: (peerIP: string) => void;
    disabled: boolean;
}

export default function PeersSelector({ targetPeers, onPeerChange, disabled }: PeersSelectorProps) {
    const { peers } = usePeerStateStore();

    const peersArray = Array.from(peers.entries());

    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : 'U'
    }

    return (
        <div className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {peersArray.map(([peerIP, peerState]) => (
                <div key={peerIP} className="flex items-center gap-2">
                    <Checkbox
                        checked={targetPeers.includes(peerIP)}
                        onCheckedChange={() => onPeerChange(peerIP)}
                        disabled={disabled}
                    />
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className={`flex-shrink-0 transition-all`}>
                            <AvatarImage src={peerState.userAvatar} />
                            <AvatarFallback>{getInitials(peerState.userName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-left truncate">
                            {peerState.userName}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}