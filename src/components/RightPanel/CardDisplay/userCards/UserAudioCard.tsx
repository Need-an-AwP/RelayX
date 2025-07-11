import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoaderCircle } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import UserAudioSpectrum from "../UserAudioSpectrum";
import type { PeerState } from "@/stores";


export default function UserAudioCard({className, onClick, peerState}: {className?: string, onClick?: () => void, peerState: PeerState}) {
    const mergerAnalyser = null
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Card
                    className={`group relative p-4 aspect-video select-none
            transition-all duration-300 flex justify-center items-center overflow-hidden
            hover:border-primary hover:ring-2 hover:bg-muted
            ${className}`}
                    onClick={onClick}
                >
                    <div className="flex h-full justify-center items-center gap-4 aspect-square p-5 z-10">
                        <Avatar className="flex-shrink-0 h-full w-full">
                            <AvatarImage src={peerState.userAvatar} />
                            <AvatarFallback>
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    {mergerAnalyser &&
                        <UserAudioSpectrum
                            analyser={mergerAnalyser}
                            className="absolute w-[100%+10px] h-full top-0 left-0 opacity-60
                    group-hover:opacity-100 transition-opacity duration-300"
                        />}
                </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem>Profile</ContextMenuItem>
                <ContextMenuItem>Billing</ContextMenuItem>
                <ContextMenuItem>Team</ContextMenuItem>
                <ContextMenuItem>Subscription</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>

    )
}