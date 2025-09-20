import { useEffect, useState, useId } from "react"
import { useLocalUserStateStore, useAudioProcessing, useAudioStore } from "@/stores"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronUp, MicOff, HeadphoneOff, Music } from "lucide-react"
import { CgScreen } from "react-icons/cg";
import { animationLoopManager } from "@/utils/animationLoopManager"


const SelfUser = () => {
    const { audioActiveThreshold } = useAudioStore()
    const { userState: selfState, initialized, initializeSelfState } = useLocalUserStateStore()
    const selfAnalyser = useAudioProcessing(state => state.analyser)
    const [isReady, setIsReady] = useState(initialized)
    const [audioActive, setAudioActive] = useState(false)
    const [isExtended, setIsExtended] = useState(false)
    const id = useId()

    useEffect(() => {
        if (!initialized) {
            initializeSelfState().then(() => {
                setIsReady(true)
            })
        }
    }, [initialized, initializeSelfState])

    useEffect(() => {
        if (!selfAnalyser) {
            setAudioActive(false)
            return
        }

        const dataArray = new Uint8Array(selfAnalyser.frequencyBinCount)

        const checkAudioLevel = () => {
            selfAnalyser.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
            setAudioActive(average > audioActiveThreshold ? true : false)
        }

        animationLoopManager.add(id, checkAudioLevel)

        return () => {
            animationLoopManager.remove(id)
        }
    }, [selfAnalyser, id])

    // 获取用户名首字母作为头像备用显示
    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : 'U'
    }

    return (
        <div
            className={`group rounded-md select-none border-1
            border-muted-foreground/30 hover:border-sky-300/100
            transition-all duration-300 ${isExtended ? 'h-45' : 'h-14'}`}
        >
            <div
                className={`relative flex flex-row justify-between items-center p-2 cursor-pointer mt-1`}
                onClick={() => setIsExtended(!isExtended)}
            >
                <div className="flex items-center gap-3 min-w-0 max-w-[95%]">
                    <Avatar className={`flex-shrink-0 transition-all ${audioActive ? 'ring-2 ring-offset-2 ring-green-500 ring-offset-background' : ''}`}>
                        <AvatarImage src={selfState.userAvatar} draggable={false} />
                        <AvatarFallback>{getInitials(selfState.userName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-left truncate">
                        {isReady ? selfState.userName : 'Loading...'}
                    </span>
                </div>
                <div className="flex items-center gap-2 mr-0.5 flex-shrink-0 text-muted-foreground
                    group-hover:opacity-0 transition-opacity duration-300">
                    {selfState.isInputMuted && <MicOff className="w-4 h-4" />}
                    {selfState.isOutputMuted && <HeadphoneOff className="w-4 h-4" />}
                    {selfState.isSharingAudio && <Music className="w-4 h-4" />}
                    {selfState.isSharingScreen && <CgScreen className="w-4 h-4" />}
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ChevronUp className={`w-5 h-5 ${!isExtended && 'rotate-180'} transition-transform duration-300`} />
                </div>
            </div>

            <div className={`${isExtended ? 'opacity-100 h-30' : 'opacity-0 h-0'} transition-all duration-300`}>
                <div className="flex justify-center items-center h-full bg-red-500/0">
                    <p className="text-sm text-muted-foreground">This is you</p>

                </div>
            </div>
        </div>
    )
}

export default SelfUser;