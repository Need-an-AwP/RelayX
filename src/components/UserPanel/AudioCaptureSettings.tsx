import { useRef, useEffect, useState } from 'react'
import { Music, CircleStop, Square } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { usePopover, useAudioProcessing, useLocalUserStateStore } from '@/stores'
import UserAudioSpectrum from "@/components/UserAudioSpectrum";


const AudioCaptureSettings = () => {
    const {
        audioSessions, getAudioSessions, isCapturing,
        startCapture, stopCapture, cpaAnalyser
    } = useAudioProcessing();

    const addonStream = useAudioProcessing(state => state.localAddonStream);

    const { activePopover, togglePopover } = usePopover();
    const isAudioCaptureOpen = activePopover === 'audioCapture';

    const { updateSelfState } = useLocalUserStateStore()

    const handleStartCapture = (pid: string) => {
        if (isCapturing.length > 0) {
            stopCapture()
        }
        startCapture(pid)

        updateSelfState({
            isSharingAudio: true
        })
    }

    const handleStopCapture = () => {
        stopCapture()
        togglePopover('audioCapture');
        updateSelfState({
            isSharingAudio: false
        })
    }

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
        if (!isAudioCaptureOpen) return;
        getAudioSessions();

    }, [isAudioCaptureOpen])

    const shouldShowAboveOverlay = `${(!activePopover || isAudioCaptureOpen) && 'z-50'}`


    return (
        <Popover open={isAudioCaptureOpen} onOpenChange={() => togglePopover('audioCapture')}>
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    variant={`${isAudioCaptureOpen ? 'outline' : 'ghost'}`}
                    className={`${shouldShowAboveOverlay} ${isCapturing && 'bg-green-800'} cursor-pointer`}
                >
                    <Music className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="relative z-50">
                <div className='relative flex flex-col gap-2 z-50'>
                    <p className='text-md font-bold'>Select Input Process</p>
                    <p className='text-sm text-muted-foreground mb-2'>Choose an audio process to capture</p>
                    <div className='flex flex-row gap-3 items-center'>
                        <Select
                            value={isCapturing}
                            onValueChange={handleStartCapture}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="select a process" />
                            </SelectTrigger>
                            <SelectContent>
                                {audioSessions.map((session) => (
                                    <SelectItem
                                        key={session.pid}
                                        value={session.pid.toString()}
                                    >
                                        {session.processName}
                                        <span className='text-xs text-muted-foreground'>
                                            {session.pid}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isCapturing.length > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            onClick={handleStopCapture}
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
                    {/* <div className="flex flex-col gap-2 my-2">
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
                    </div> */}
                    {/* <audio ref={audioRef} autoPlay controls className='w-full' /> */}
                </div>
                {isCapturing.length > 0 && cpaAnalyser && (
                    <div className="absolute top-0 left-0 w-full h-full z-0">
                        <UserAudioSpectrum
                            renderId="audio-capture"
                            analyser={cpaAnalyser}
                            className="h-full w-full rounded-md opacity-50"
                        />

                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

export default AudioCaptureSettings