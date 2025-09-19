export { default as UserThumbnailCard } from "./UserThumbnailCard"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoaderCircle } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu"
import UserAudioSpectrum from "@/components/UserAudioSpectrum";
import { type PeerState, TrackID } from "@/types"
import { AudioContextManager } from "@/AudioManager"
import { useVideoStreamStore } from "@/stores/videoStreamStore"

type peerIP = string;

export function UserCard({ maximiumCard,
    className,
    onClick,
    peerIP,
    peerState
}: {
    maximiumCard: string | null,
    className?: string,
    onClick?: () => void,
    peerIP: peerIP,
    peerState: PeerState
}) {
    const PeerNodeManager = AudioContextManager.getInstance().peerManager
    const analyser = PeerNodeManager.getPeerNodes(peerIP)?.analyserNode

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isDisplayingSpectrum, setIsDisplayingSpectrum] = useState(false)
    const [isDisplayingAvatar, setIsDisplayingAvatar] = useState(true)
    const [hasVideoTrack, setHasVideoTrack] = useState(false);
    const videoStream = useVideoStreamStore(state => state.streamsByPeer[peerIP]?.find(vs => vs.trackID === TrackID.SCREEN_SHARE_VIDEO) || null);

    useEffect(() => {
        if (videoRef.current && videoStream && !isDisplayingSpectrum) {
            const video = videoRef.current;
            video.srcObject = videoStream.stream;
        }
        setHasVideoTrack(!!videoStream);
    }, [videoStream, isDisplayingSpectrum, peerState.isSharingScreen, peerIP]);

    return (
        <ContextMenu key={peerIP}>
            <ContextMenuTrigger>
                <Card
                    className={`group relative p-0 aspect-video select-none overflow-hidden
                    flex justify-center items-center hover:bg-muted
                    transition-[top,right,bottom,left,background-color,border-radius,box-shadow,border-color,border-width,outline-color] duration-300 
                    ${maximiumCard === peerIP ? 'absolute inset-0 top-1/2 -translate-y-1/2 rounded-none hover:ring-0 border-none' :
                            'hover:ring-muted-foreground hover:ring-2'}
                    ${maximiumCard !== null && maximiumCard !== peerIP && 'hidden'}
                    ${className}`}
                    onClick={onClick}
                >
                    {peerState.isSharingScreen && !isDisplayingSpectrum ?
                        <>
                            <div className="h-full w-full">
                                <video
                                    key={videoStream?.trackID || 'no-track'} // 强制重新渲染
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="h-full w-full object-fit object-center"
                                />
                                <div className={`absolute top-2 left-2 w-[6%] aspect-square z-10 opacity-0 
                                    ${maximiumCard === peerIP ? 'group-hover:opacity-100' : ''}
                                    transition-opacity duration-300`}>
                                    <Avatar className="flex-shrink-0 h-full w-full">
                                        <AvatarImage src={peerState.userAvatar} draggable={false} />
                                        <AvatarFallback>
                                            <LoaderCircle className="w-4 h-4 animate-spin" />
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                        </> : <>
                            <div className={`flex w-[30%] justify-center items-center aspect-square z-10
                                ${isDisplayingAvatar ? 'opacity-100' : 'opacity-0'}
                                transition-opacity duration-300`}>
                                <Avatar className="flex-shrink-0 h-full w-full">
                                    <AvatarImage src={peerState.userAvatar} draggable={false} />
                                    <AvatarFallback>
                                        <LoaderCircle className="w-4 h-4 animate-spin" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            {analyser &&
                                <UserAudioSpectrum
                                    renderId={`user-audio-card-${peerIP}`}
                                    analyser={analyser}
                                    className="absolute w-full h-full top-0 left-0 opacity-60
                                    group-hover:opacity-100 transition-opacity duration-300"
                                    verticalAlignment='center'
                                />}
                        </>}
                </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => {
                    setIsDisplayingAvatar(!isDisplayingAvatar)
                }}>
                    {isDisplayingAvatar ? 'Hide avatar' : 'Show avatar'}
                </ContextMenuItem>
                {hasVideoTrack && <ContextMenuItem onClick={() => {
                    setIsDisplayingSpectrum(!isDisplayingSpectrum)
                }}>
                    Switch to display {isDisplayingSpectrum ? 'video' : 'spectrum'}
                </ContextMenuItem>}
                <ContextMenuSeparator />
                <span className='block max-w-[200px] px-2 text-xs text-muted-foreground overflow-hidden truncate'>
                    {peerState.userName}
                </span>
            </ContextMenuContent>
        </ContextMenu>

    )
}