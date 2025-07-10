import { useRef, useEffect, useState } from 'react'
import { Music, CircleStop, Square } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { usePopover, useAudioProcessing, usePeerStateStore } from '@/stores'
import AudioSpectrum from '@/components/AudioSpectrum'


const AudioCaptureSettings = () => {
    const audioProcesses = useAudioProcessing(state => state.audioProcesses);
    const captureProcess = useAudioProcessing(state => state.captureProcess);
    const processorInterval = useAudioProcessing(state => state.processorInterval);
    const updateAudioProcessList = useAudioProcessing(state => state.updateAudioProcessList);
    const updateCaptureProcess = useAudioProcessing(state => state.updateCaptureProcess);
    const addonStream = useAudioProcessing(state => state.localAddonStream);
    const addonGainValue = useAudioProcessing(state => state.addonGainValue);
    const setAddonGainValue = useAudioProcessing(state => state.setAddonGainValue);
    const isCapturing = useAudioProcessing(state => state.isCapturing);

    const isAudioCapturePopoverOpen = usePopover(state => state.isAudioCapturePopoverOpen);
    const toggle = usePopover(state => state.toggle);

    const selfState = usePeerStateStore(state => state.selfState)
    const updateSelfState = usePeerStateStore(state => state.updateSelfState)
    /*
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.srcObject = addonStream;
            console.log('play audio')
        }
    }, [addonStream, isCapturing]);
    */
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
                    className={`${isAudioCapturePopoverOpen && 'z-50'} ${isCapturing && 'bg-green-800'} cursor-pointer`}
                    disabled={audioProcesses === null}
                // disabled={true}
                >
                    <Music className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="z-50">
                <div className='flex flex-col gap-2'>
                    <p className='text-md font-bold'>Select Input Process</p>
                    <p className='text-sm text-muted-foreground mb-2'>Choose an audio process to capture</p>
                    <div className='flex flex-row gap-3 items-center'>
                        <Select
                            value={captureProcess?.toString() ?? ''}
                            onValueChange={(processId) => {
                                updateCaptureProcess(parseInt(processId))
                                updateSelfState({
                                    isSharingAudio: true
                                })
                            }}
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
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                updateCaptureProcess(null);
                                                toggle('isAudioCapturePopoverOpen');
                                                updateSelfState({
                                                    isSharingAudio: false
                                                })
                                            }}
                                            className="rounded-full w-9 h-9 cursor-pointer hover:!bg-red-800"
                                        >
                                            <Square />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>stop capture</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
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
                    {/* <audio ref={audioRef} autoPlay controls className='w-full' /> */}
                    {captureProcess !== null && addonStream && (
                        <div className="relative">
                            <AudioSpectrum
                                stream={addonStream}
                                isEnabled={isAudioCapturePopoverOpen}
                                className="h-[120px] rounded-md border-1 border-muted-foreground"
                            />
                            <div className='absolute right-0 top-0 text-xs text-muted-foreground m-2'>
                                {processorInterval}ms
                            </div>

                        </div>
                    )}


                </div>
            </PopoverContent>
        </Popover>
    )
}

export default AudioCaptureSettings