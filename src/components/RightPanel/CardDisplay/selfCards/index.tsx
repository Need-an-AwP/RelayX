export { default as SelfThumbnailCard } from './SelfThumbnailCard';


import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu"
import { LoaderCircle } from "lucide-react";
import { useAudioProcessing, useLocalUserStateStore, useDesktopCapture } from "@/stores"
import UserAudioSpectrum from "@/components/UserAudioSpectrum";


export function SelfCard({
    maximiumCard,
    className,
    idKey,
    onClick
}: {
    maximiumCard: string | null,
    className?: string,
    idKey?: number,
    onClick?: () => void
}) {
    const { userState: selfState } = useLocalUserStateStore()
    const { mergerAnalyser } = useAudioProcessing()
    const { stream } = useDesktopCapture()
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isDisplayingSpectrum, setIsDisplayingSpectrum] = useState(false)
    const [isDisplayingAvatar, setIsDisplayingAvatar] = useState(true)

    useEffect(() => {
        if (videoRef.current && stream && !isDisplayingSpectrum) {
            videoRef.current.srcObject = stream;
            // videoRef.current.play();
        }
    }, [stream, isDisplayingSpectrum]);

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Card
                    className={`group relative p-0 aspect-video select-none overflow-hidden
                    flex justify-center items-center hover:bg-muted
                    transition-[top,right,bottom,left,background-color,border-radius,box-shadow,border-color,border-width,outline-color] duration-300 
                    ${maximiumCard === 'self' ? 'absolute inset-0 top-1/2 -translate-y-1/2 rounded-none hover:ring-0 border-none' :
                            'hover:ring-muted-foreground hover:ring-2'}
                    ${maximiumCard !== null && maximiumCard !== 'self' && 'hidden'}
                    ${className}`}
                    onClick={onClick}
                >
                    {selfState.isSharingScreen && !isDisplayingSpectrum ?
                        <>
                            <div className="h-full w-full">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="h-full w-full object-fit object-center"
                                />
                                <div className={`absolute top-2 left-2 w-[6%] aspect-square z-10 opacity-0 
                                    ${maximiumCard === 'self' && isDisplayingAvatar ? 'group-hover:opacity-100' : ''}
                                    transition-opacity duration-300`}>
                                    <Avatar className="flex-shrink-0 h-full w-full">
                                        <AvatarImage src={selfState.userAvatar} draggable={false} />
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
                                    <AvatarImage src={selfState.userAvatar} draggable={false} />
                                    <AvatarFallback>
                                        <LoaderCircle className="w-4 h-4 animate-spin" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            {mergerAnalyser &&
                                <UserAudioSpectrum
                                    renderId={idKey ? `self-audio-card-${idKey}` : "self-audio-card"}// idKey is for debugging
                                    analyser={mergerAnalyser}
                                    className="absolute w-full h-full top-0 left-0 opacity-60
                                    group-hover:opacity-100 transition-opacity duration-300"
                                    verticalAlignment='center'
                                    displayStyle='line'
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
                {stream && <ContextMenuItem onClick={() => {
                    setIsDisplayingSpectrum(!isDisplayingSpectrum)
                }}>
                    Switch to display {isDisplayingSpectrum ? 'video' : 'spectrum'}
                </ContextMenuItem>}
                <ContextMenuSeparator />
                <span className='block max-w-[200px] px-2 text-xs text-muted-foreground overflow-hidden truncate'>
                    {selfState.userName}
                </span>
            </ContextMenuContent>
        </ContextMenu>

    )
}