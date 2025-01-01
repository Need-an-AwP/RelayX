import { useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"
import { Mic, MicOff } from 'lucide-react'


const MicphoneSettings = () => {
    const [isMicMuted, setIsMicMuted] = useState(false)
    // only for demo
    const [inputVolume, setInputVolume] = useState(1)

    return (
        <TooltipProvider>
            <Tooltip delayDuration={10}>
                <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost"
                        onClick={() => {
                            if (isMicMuted) {
                                setInputVolume(1)
                            } else {
                                setInputVolume(0)
                            }
                            setIsMicMuted(!isMicMuted);
                        }}>
                        {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="w-full h-[150px] ml-2">
                    <div className='flex flex-row gap-6 w-full h-full items-center'>
                        <Slider
                            min={0}
                            max={500}
                            orientation='vertical'
                            className="w-[25px] h-full bg-secondary rounded-full"
                            value={[inputVolume * 100]}
                            onValueChange={(value) => { setInputVolume(value[0] / 100) }}
                        />
                        <div className='flex flex-col gap-2 items-center w-full'>
                            <p className='text-sm text-muted-foreground font-bold'>Current Input:</p>
                            <p className='text-lg font-bold'>{Math.round(inputVolume * 100)}%</p>
                            <p className='text-sm text-muted-foreground'>max input volume <br /> could be 500%</p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default MicphoneSettings