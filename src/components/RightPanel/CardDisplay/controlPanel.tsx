import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Headphones, HeadphoneOff, Video, Expand, Shrink, MessageCircle } from 'lucide-react'
import { ImPhoneHangUp } from "react-icons/im";


export default function ControlPanel({ switchFullScreen }: { switchFullScreen: any }) {
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
            <Button variant="ghost" className='cursor-pointer'>
                <MessageCircle className="w-4 h-4" />
            </Button>
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
            <Button variant="ghost" className='cursor-pointer hover:!bg-red-500 bg-accent'>
                <ImPhoneHangUp />
            </Button>
        </div>
    )
}