import { useState } from 'react'
import { Headphones, HeadphoneOff } from 'lucide-react'

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"


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
                <TooltipContent className="w-full h-[150px] ml-12">
                    <div className='flex flex-row gap-1 w-full h-full items-center mr-0'>
                        <Slider
                            min={0}
                            max={500}
                            orientation='vertical'
                            className="w-[25px] h-full bg-secondary rounded-full"
                            value={[outputVolume * 100]}
                            onValueChange={(value) => { setOutputVolume(value[0] / 100) }}
                        />
                        <div className='flex flex-col gap-2 items-center w-full'>
                            <p className='text-sm text-muted-foreground font-bold'>Current Output:</p>
                            <p className='text-lg font-bold'>{Math.round(outputVolume * 100)}%</p>
                            <p className='text-sm text-muted-foreground'>max output volume <br /> could be 500%</p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default HeadphoneSettings