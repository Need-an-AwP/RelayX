import { useEffect, useState } from "react"
import { useMediaStore, usePeerStateStore } from "@/stores"
import type { PeerState, peerIP } from "@/stores"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, MicOff, HeadphoneOff, Music, Cast, Headphones } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Label } from "@/components/ui/label"


const User = ({ peerIP, peerState }: { peerIP: peerIP, peerState: PeerState }) => {
    const [audioActive, setAudioActive] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isMutedForThisUser, setIsMutedForThisUser] = useState(false)
    const [isExtended, setIsExtended] = useState(false)

    const getPeerAnalyserNode = useMediaStore(state => state.getPeerAnalyserNode)

    useEffect(() => {
        const analyser = getPeerAnalyserNode(peerIP)
        if (!analyser) {
            setAudioActive(false)
            return
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        let animationFrameId: number

        const checkAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length

            // threshold
            if (average > 5) {
                setAudioActive(true)
            } else {
                setAudioActive(false)
            }
            animationFrameId = requestAnimationFrame(checkAudioLevel)
        }

        checkAudioLevel()

        return () => {
            cancelAnimationFrame(animationFrameId)
        }
    }, [peerIP, getPeerAnalyserNode])

    // 获取用户名首字母作为头像备用显示
    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : 'U'
    }

    return (
        <div
            className={`rounded-md border-1 border-muted-foreground/30 hover:border-muted-foreground/100
                flex flex-col
            transition-all duration-300 
            ${isExtended ? 'h-60' : 'h-14'}`}
        >
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        className={`flex flex-row justify-between items-center p-2 cursor-pointer`}
                        onClick={() => setIsExtended(!isExtended)}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className={`flex-shrink-0 transition-all ${audioActive ? 'ring-2 ring-offset-2 ring-green-500 ring-offset-background' : ''}`}>
                                <AvatarImage src={peerState.userAvatar} />
                                <AvatarFallback>{getInitials(peerState.userName)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-left truncate">
                                {peerState.userName}
                            </span>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                            {peerState.isInputMuted &&
                                <Button variant="ghost" size="icon" disabled={true} >
                                    <MicOff className="w-4 h-4" />
                                </Button>}
                            {peerState.isOutputMuted &&
                                <Button variant="ghost" size="icon" disabled={true} >
                                    <HeadphoneOff className="w-4 h-4" />
                                </Button>}
                            {peerState.isSharingAudio &&
                                <Button variant="ghost" size="icon" disabled={true} >
                                    <Music className="w-4 h-4" />
                                </Button>}
                            {peerState.isSharingScreen &&
                                <Button variant="ghost" size="icon" disabled={true} >
                                    <Cast className="w-4 h-4" />
                                </Button>}
                            <Button variant="ghost" size="icon" disabled={true} >
                                {isExtended ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem>
                        <p>do some advanced settings here</p>
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>


            {/* extended content */}
            <div className={`border-t-1 border-muted-foreground/30 overflow-hidden
                ${isExtended ? 'opacity-100 h-50' : 'opacity-0 h-0'} transition-all duration-300`}>
                <div className="flex justify-between items-start h-full">
                    <div className="flex-1 flex flex-col justify-evenly text-center px-4 h-full w-1/2 border-r-1 border-muted-foreground/30">
                        <div className="flex items-center gap-2 w-full">
                            <Slider
                                min={0}
                                max={150}
                                step={1}
                            />
                            <Label>{isMuted ? <HeadphoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}</Label>
                        </div>

                        <div className="flex items-center gap-2 w-full">
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                disabled={true}
                            />
                            <Label><Music className="w-4 h-4" /></Label>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4 justify-center px-4 h-full w-1/2">
                        <Button
                            variant='outline'
                            className={`w-full cursor-pointer ${isMuted ? '!bg-red-500' : 'text-red-500'}`}
                            onClick={() => setIsMuted(!isMuted)}
                        >
                            {isMuted ? 'unmute this user' : 'mute this user'}
                        </Button>
                        <Button
                            variant="outline"
                            className={`w-full cursor-pointer ${isMutedForThisUser ? '!bg-red-500' : 'text-red-500'}`}
                            onClick={() => setIsMutedForThisUser(!isMutedForThisUser)}
                        >
                            {isMutedForThisUser ? 'unmute my voice' : 'mute my voice for this user'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/*

*/

export default User;