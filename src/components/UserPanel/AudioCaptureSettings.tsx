import { useState, useLayoutEffect, useRef } from 'react'
import { Music } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { usePopover } from '@/stores/popoverStore'

const AudioCaptureSettings = () => {
    // only for demo
    const [audioProcesses, setAudioProcesses] = useState(null);

    const isAudioCapturePopoverOpen = usePopover(state => state.isAudioCapturePopoverOpen);
    const toggle = usePopover(state => state.toggle);


    return (
        <Popover open={isAudioCapturePopoverOpen} onOpenChange={() => toggle('isAudioCapturePopoverOpen')}>
            <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className={isAudioCapturePopoverOpen ? 'z-50' : ''} disabled={audioProcesses === null}>
                    <Music className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
        </Popover>
    )
}

export default AudioCaptureSettings