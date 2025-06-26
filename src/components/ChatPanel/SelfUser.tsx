import { useEffect, useState } from "react"
import { usePeerStateStore } from "@/stores"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, MicOff, HeadphoneOff, Music, Cast } from "lucide-react"


const SelfUser = () => {
    const selfState = usePeerStateStore(state => state.selfState)
    const { initialized, initializeSelfState } = usePeerStateStore()
    const [isReady, setIsReady] = useState(initialized)
    const [audioActive, setAudioActive] = useState(false)
    const [isExtended, setIsExtended] = useState(false)

    useEffect(() => {
        if (!initialized) {
            initializeSelfState().then(() => {
                setIsReady(true)
            })
        }
    }, [initialized, initializeSelfState])

    useEffect(() => {
        // const interval = setInterval(() => {
        // const lightup = Math.random() < 0.5
        // setAudioActive(lightup)
        // console.log(lightup)
        // }, 1000)
        // return () => clearInterval(interval)
    }, [])

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
                <div className="flex items-center gap-4">
                    <Avatar className={`flex-shrink-0 transition-all ${audioActive ? 'ring-2 ring-offset-2 ring-green-500 ring-offset-background' : ''}`}>
                        <AvatarImage src={selfState.userAvatar} />
                        <AvatarFallback>{getInitials(selfState.userName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex w-full">
                        <span className="text-sm text-left line-clamp-2 break-all">
                            {isReady ? selfState.userName : 'Loading...'}
                        </span>
                    </div>
                </div>
                <div>
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