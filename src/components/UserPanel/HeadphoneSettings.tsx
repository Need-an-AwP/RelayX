import { useState } from 'react'
import { Headphones, HeadphoneOff } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import DynamicVolumeSlider from "./DynamicVolumeSlider";
import { cn } from "@/lib/utils";

const HeadphoneSettings = () => {
    const [isHeadphoneMuted, setIsHeadphoneMuted] = useState(false)
    // only for demo
    const [outputVolume, setOutputVolume] = useState(1)


    return (
        <TooltipProvider>
            <Tooltip delayDuration={10}>
                <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost"
                        onClick={() => {
                            if (isHeadphoneMuted) {
                                setOutputVolume(1)
                            } else {
                                setOutputVolume(0)
                            }
                            setIsHeadphoneMuted(!isHeadphoneMuted)
                        }}>
                        {isHeadphoneMuted ? <HeadphoneOff className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="w-full h-[150px] ml-2">
                    <div className='flex flex-row gap-1 w-full h-full items-center mr-0'>
                        <DynamicVolumeSlider
                            className='ml-2 mr-4'
                            value={outputVolume * 100}
                            onValueChange={(value) => { setOutputVolume(value / 100) }}
                            dynamicTopMin={100}
                            dynamicTopMax={300}
                            topGap={50}
                        />
                        <div className='flex flex-col gap-4 w-full text-left'>
                            <p className='text-sm text-muted-foreground font-bold'>Current Output<br /> Volume:</p>
                            <p className={cn('text-xl font-bold tracking-tighter', outputVolume > 1 ? "text-red-400" : "text-white")}>
                                {Math.round(outputVolume * 100)}%
                            </p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default HeadphoneSettings