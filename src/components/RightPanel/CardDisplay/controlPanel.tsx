import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Headphones, HeadphoneOff, Video, Expand, Shrink, MessageCircle } from 'lucide-react'
import { ImPhoneHangUp } from "react-icons/im";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useLocalUserStateStore } from "@/stores"


export default function ControlPanel({ switchFullScreen }: { switchFullScreen: any }) {
    const { updateSelfState } = useLocalUserStateStore()
    const [isMicMuted, setIsMicMuted] = useState(false)
    const [isHeadphoneMuted, setIsHeadphoneMuted] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)

    return (
        <div className='flex flex-row gap-2 p-2'>
            <Button
                variant="ghost"
                className='cursor-pointer'
                onClick={() => {
                    switchFullScreen(isFullScreen ? 'shrink' : 'expand')
                    setIsFullScreen(!isFullScreen)
                }}
            >
                {isFullScreen ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
            </Button>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" className='cursor-pointer'>
                        <MessageCircle className="w-4 h-4" />
                    </Button>
                </SheetTrigger>
                <SheetContent className='mt-[32px] flex justify-center'>
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <MessageCircle className="w-8 h-8" />
                            Chat history
                        </SheetTitle>
                        <SheetDescription>
                            blablababla<br />
                            blablababla<br />
                            blablababla<br />
                            blablababla<br />
                        </SheetDescription>
                    </SheetHeader>

                </SheetContent>
            </Sheet>
            <div className='flex flex-row gap-2 rounded-md bg-muted/40'>
                <Button
                    variant="ghost"
                    className='cursor-pointer'
                    onClick={() => setIsMicMuted(!isMicMuted)}
                >
                    {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                    variant="ghost"
                    className='cursor-pointer'
                    onClick={() => setIsHeadphoneMuted(!isHeadphoneMuted)}
                >
                    {isHeadphoneMuted ? <HeadphoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                </Button>
            </div>
            <Button variant="ghost" className='cursor-pointer'>
                <Video className="w-4 h-4" />
            </Button>
            <Button
                variant="ghost"
                className='cursor-pointer hover:!bg-red-500 bg-accent'
                onClick={() => {
                    updateSelfState({
                        isInChat: false
                    })
                }}
            >
                <ImPhoneHangUp />
            </Button>
        </div>
    )
}