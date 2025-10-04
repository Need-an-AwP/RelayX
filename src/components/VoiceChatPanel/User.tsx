import { useEffect, useState, useId } from "react"
import type { PeerState } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronUp, MicOff, HeadphoneOff, Music, Headphones, Volume2, VolumeOff } from "lucide-react"
import { CgScreen } from "react-icons/cg";
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
import { useAudioStore, useLocalUserStateStore } from "@/stores"
import { Label } from "@/components/ui/label"
import { animationLoopManager } from "@/utils/animationLoopManager"
import { AudioContextManager } from "@/AudioManager"


const User = ({ peerIP, peerState }: { peerIP: string, peerState: PeerState }) => {
    const { isInChat: isLocalInChat } = useLocalUserStateStore(state => state.userState)
    const { audioActiveThreshold, setMutedPeer } = useAudioStore()
    const [audioActive, setAudioActive] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isMutedForThisUser, setIsMutedForThisUser] = useState(false)
    const [isExtended, setIsExtended] = useState(false)
    const [volumeValue, setVolumeValue] = useState(100)
    const [isSliderHovered, setIsSliderHovered] = useState(false)
    const id = useId()

    const PeerNodeManager = AudioContextManager.getInstance().peerManager
    // const setPeerMuted = 

    useEffect(() => {
        PeerNodeManager.setPeerMuted(peerIP, isMuted)
        setMutedPeer(peerIP, isMuted)
    }, [isMuted])

    useEffect(() => {
        if (!isLocalInChat) return;

        const checkAudioLevel = () => {
            const volumeLevel = PeerNodeManager.getPeerVolumeLevel(peerIP)
            if (isNaN(volumeLevel)) return;
            setAudioActive(volumeLevel > audioActiveThreshold ? true : false)
        }

        animationLoopManager.add(id, checkAudioLevel)

        return () => {
            animationLoopManager.remove(id)
        }
    }, [peerIP, id, isLocalInChat])

    // 获取用户名首字母作为头像备用显示
    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : 'U'
    }

    return (
        <div
            className={`group rounded-md border-1 border-muted-foreground/30 hover:border-muted-foreground/100
            flex flex-col select-none
            transition-all duration-300 ${isExtended ? 'h-40' : 'h-14'}`}
        >
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        className={`relative flex flex-row justify-between items-center p-2 cursor-pointer mt-1`}
                        onClick={() => setIsExtended(!isExtended)}
                    >
                        <div className="flex items-center gap-3 min-w-0 max-w-[95%]">
                            <Avatar className={`flex-shrink-0 transition-all 
                                ${audioActive ? 'ring-2 ring-offset-2 ring-offset-background' : ''}
                                ${isMuted ? 'ring-red-500' : 'ring-green-500'}`}>
                                <AvatarImage src={peerState.userAvatar} draggable={false} />
                                <AvatarFallback>{getInitials(peerState.userName)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-left truncate ">
                                {peerState.userName}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mr-0.5 flex-shrink-0 text-muted-foreground
                            group-hover:opacity-0 transition-opacity duration-300">
                            {peerState.isInputMuted && <MicOff className="w-4 h-4" />}
                            {peerState.isOutputMuted && <HeadphoneOff className="w-4 h-4" />}
                            {peerState.isSharingAudio && <Music className="w-4 h-4" />}
                            {peerState.isSharingScreen && <CgScreen className="w-4 h-4" />}
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ChevronUp className={`w-5 h-5 ${!isExtended && 'rotate-180'} transition-transform duration-300`} />
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
                    <div className="flex-1 flex flex-col justify-evenly text-center px-8 h-full w-1/2">
                        <div className="flex items-center gap-2 w-full">
                            <div
                                className="flex-1 py-2"
                                onMouseEnter={() => setIsSliderHovered(true)}
                                onMouseLeave={() => setIsSliderHovered(false)}
                            >
                                <Slider
                                    defaultValue={[100]}
                                    min={0}
                                    max={200}
                                    step={1}
                                    disabled={isMuted}
                                    onValueChange={([value]) => {
                                        setVolumeValue(value);
                                        PeerNodeManager.setPeerVolume(peerIP, value / 100);
                                    }}
                                />
                            </div>
                            <Label
                                className="cursor-pointer min-w-10 flex items-center justify-center"
                                onClick={() => setIsMuted(!isMuted)}
                            >
                                {isSliderHovered ? (
                                    <span className="text-xs">{volumeValue}%</span>
                                ) : (
                                    isMuted ? <VolumeOff className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />
                                )}
                            </Label>
                        </div>

                        {peerState.isSharingAudio &&
                            <div className="flex items-center gap-4 w-full">
                                <Slider
                                    defaultValue={[100]}
                                    min={0}
                                    max={200}
                                    step={1}
                                    disabled={true}
                                />
                                <Label><Music className="w-4 h-4" /></Label>
                            </div>}
                    </div>

                    {/* <div className="flex-1 flex flex-col gap-4 justify-center px-4 h-full w-1/2">
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
                    </div> */}
                </div>
            </div>
        </div>
    )
}


export default User;