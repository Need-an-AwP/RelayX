import { usePeerStateStore } from "@/stores"
import SelfUser from "./SelfUser"
import User from "./User"

export default function VoiceChatPanel() {
    const peers = usePeerStateStore(state => state.peers)
    const selfState = usePeerStateStore(state => state.selfState)

    return (
        <div className="h-full w-full min-w-0 overflow-y-scroll
        [scrollbar-gutter:stable]
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-muted-foreground/0
        hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
            <div className="p-3 pr-0 space-y-2">
                {/* {selfState.isInChat && Array.from({ length: 10 }).map((_, index) => <SelfUser key={index} />)} */}
                {selfState.isInChat && <SelfUser />}

                {Array.from(peers.entries()).map(([peerIP, peerState]) => {
                    if (peerState.isInChat) {
                        return (
                            <User key={peerIP} peerIP={peerIP} peerState={peerState} />
                        )
                    } else {
                        return null
                    }
                })}
            </div>
        </div>
    )
}
