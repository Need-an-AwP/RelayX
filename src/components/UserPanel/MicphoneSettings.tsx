import { useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import DynamicVolumeSlider from "./DynamicVolumeSlider";
import { Mic, MicOff } from 'lucide-react'
import { cn } from "@/lib/utils";


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
                    <div className='flex flex-row gap-1 w-full h-full items-center mr-0'>
                        <DynamicVolumeSlider
                            className='ml-2 mr-4'
                            value={inputVolume * 100}
                            onValueChange={(value) => { setInputVolume(value / 100) }}
                            dynamicTopMin={100}
                            dynamicTopMax={300}
                            topGap={50}
                        />
                        <div className='flex flex-col gap-4 w-full text-left'>
                            <p className='text-sm text-muted-foreground font-bold'>Current Input<br /> Volume:</p>
                            <p className={cn('text-xl font-bold tracking-tighter', inputVolume > 1 ? "text-red-400" : "text-white")}>
                                {Math.round(inputVolume * 100)}%
                            </p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default MicphoneSettings