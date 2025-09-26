import { useState, useEffect } from "react"
import { useLocalUserStateStore, useRemoteUsersStore } from "@/stores"
import SelfUser from "./SelfUser"
import User from "./User"
import PlaceHolder from "./PlaceHolder"


export default function VoiceChatPanel() {
    const { userState: selfState } = useLocalUserStateStore()
    const { peers } = useRemoteUsersStore()
    const [isEmpty, setIsEmpty] = useState(true)

    useEffect(() => {
        const hasActivePeer = Object.entries(peers).find(([_, peerState]) => peerState.isInChat);

        if (!hasActivePeer && !selfState.isInChat) {
            setIsEmpty(true)
        } else {
            setIsEmpty(false)
        }
    }, [peers, selfState])

    return (isEmpty ?
        <div className="h-full flex items-center justify-center">
            <PlaceHolder />
        </div>
        :
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

                {Object.entries(peers).map(([peerIP, peerState]) => {
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
