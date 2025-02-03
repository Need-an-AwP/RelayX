import { useState, useLayoutEffect, useRef, useEffect } from 'react'
import { Music, CircleStop, Square } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { usePopover } from '@/stores/popoverStore'
import { useAudioProcessing } from '@/stores'
import AudioSpectrum from '../AudioSpectrum'


const AudioCaptureSettings = () => {
    // only for demo
    const audioProcesses = useAudioProcessing(state => state.audioProcesses);
    const captureProcess = useAudioProcessing(state => state.captureProcess);
    const processorInterval = useAudioProcessing(state => state.processorInterval);
    const updateAudioProcessList = useAudioProcessing(state => state.updateAudioProcessList);
    const updateCaptureProcess = useAudioProcessing(state => state.updateCaptureProcess);
    const addonStream = useAudioProcessing(state => state.localAddonStream);
    const addonGainValue = useAudioProcessing(state => state.addonGainValue);
    const setAddonGainValue = useAudioProcessing(state => state.setAddonGainValue);

    const isAudioCapturePopoverOpen = usePopover(state => state.isAudioCapturePopoverOpen);
    const toggle = usePopover(state => state.toggle);

    useEffect(() => {
        if (!isAudioCapturePopoverOpen) return;
        // set audio processes check in component
        const audioCaptureInterval = setInterval(() => {
            updateAudioProcessList();
        }, 800);

        return () => {
            clearInterval(audioCaptureInterval);
        };
    }, [isAudioCapturePopoverOpen])

    return (
        <Popover open={isAudioCapturePopoverOpen} onOpenChange={() => toggle('isAudioCapturePopoverOpen')}>
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className={isAudioCapturePopoverOpen ? 'z-50' : ''}
                    disabled={audioProcesses === null}
                >
                    <Music className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="z-50">
                <div className='flex flex-col gap-2'>
                    <p className='text-md font-bold'>Select Input Process</p>
                    <p className='text-sm text-muted-foreground mb-2'>Choose an audio process to capture for your stream</p>
                    <div className='flex flex-row gap-3 items-center'>
                        <Select
                            value={captureProcess?.toString()}
                            onValueChange={(processId) => { updateCaptureProcess(parseInt(processId)) }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="select a process" />
                            </SelectTrigger>
                            <SelectContent>
                                {audioProcesses.map(item =>
                                    <SelectItem value={item.processId.toString()} key={item.processId}>
                                        {item.processName}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {captureProcess !== null && (
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    updateCaptureProcess(null);
                                    toggle('isAudioCapturePopoverOpen');
                                }}
                                className="rounded-full w-9 h-9"
                            >
                                <Square />
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 my-2">
                        <div className="flex justify-between text-sm">
                            <span>Output Volume</span>
                            <span className="text-zinc-400">{Math.round(addonGainValue)}%</span>
                        </div>
                        <Slider
                            min={0}
                            max={100}
                            value={[addonGainValue]}
                            onValueChange={(value) => setAddonGainValue(value[0])}
                        />
                    </div>
                    {addonStream && (
                        <div className="relative">
                            <AudioSpectrum
                                stream={addonStream}
                                isEnabled={isAudioCapturePopoverOpen}
                                className="h-[120px]"
                            />
                            {captureProcess !== null &&
                                <div className='absolute right-0 top-0 text-xs text-muted-foreground m-2'>
                                    {processorInterval}ms
                                </div>}
                        </div>
                    )}


                </div>
            </PopoverContent>
        </Popover>
    )
}

export default AudioCaptureSettings