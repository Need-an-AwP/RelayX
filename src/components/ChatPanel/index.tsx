import { usePeerStateStore } from "@/stores"
import { ScrollArea } from "@/components/ui/scroll-area"
import SelfUser from "./SelfUser"
import User from "./User"

const ChatPanel = () => {
    const peers = usePeerStateStore(state => state.peers)
    const selfState = usePeerStateStore(state => state.selfState)

    return (
        <ScrollArea className='w-full h-full bg-red-500/0'>
            <div className="flex flex-col gap-2 p-4">
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

        </ScrollArea>
    )
}

export default ChatPanel