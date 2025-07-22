import { useEffect, useState, useId } from "react"
import { usePeerStateStore, useAudioProcessing } from "@/stores"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, MicOff, HeadphoneOff, Music, Cast } from "lucide-react"
import { animationLoopManager } from "@/utils/animationLoopManager"


const SelfUser = () => {
    const selfState = usePeerStateStore(state => state.selfState)
    const selfAnalyser = useAudioProcessing(state => state.analyser)
    const { initialized, initializeSelfState } = usePeerStateStore()
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

            // threshold
            if (average > 5) {
                setAudioActive(true)
            } else {
                setAudioActive(false)
            }
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
            className={`rounded-md border-1 border-muted-foreground/30 hover:border-sky-300/100
            transition-all duration-300
            ${isExtended ? 'h-45' : 'h-14'}`}
        >
            <div
                className={`flex flex-row justify-between items-center p-2 cursor-pointer`}
                onClick={() => setIsExtended(!isExtended)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar className={`flex-shrink-0 transition-all ${audioActive ? 'ring-2 ring-offset-2 ring-green-500 ring-offset-background' : ''}`}>
                        <AvatarImage src={selfState.userAvatar} draggable={false} />
                        <AvatarFallback>{getInitials(selfState.userName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-left truncate">
                        {isReady ? selfState.userName : 'Loading...'}
                    </span>
                </div>
                <div className="flex items-center flex-shrink-0">
                    {selfState.isInputMuted &&
                        <Button variant="ghost" size="icon" disabled={true} >
                            <MicOff className="w-4 h-4" />
                        </Button>}
                    {selfState.isOutputMuted &&
                        <Button variant="ghost" size="icon" disabled={true} >
                            <HeadphoneOff className="w-4 h-4" />
                        </Button>}
                    {selfState.isSharingAudio &&
                        <Button variant="ghost" size="icon" disabled={true} >
                            <Music className="w-4 h-4" />
                        </Button>}
                    {selfState.isSharingScreen &&
                        <Button variant="ghost" size="icon" disabled={true} >
                            <Cast className="w-4 h-4" />
                        </Button>}
                    <Button variant="ghost" size="icon" disabled={true} >
                        {isExtended ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
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