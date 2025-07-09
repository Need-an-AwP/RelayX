import { useRef, useEffect, useState } from 'react'
import { Music, CircleStop, Square } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { usePopover, useAudioProcessing, usePeerStateStore } from '@/stores'
import AudioSpectrum from '@/components/AudioSpectrum'
import type { CaptureSource } from '@/stores'


const AudioCaptureSettings = () => {
    const addSource2AudioCapture = useAudioProcessing(state => state.addSource2AudioCapture)
    const isAudioCapturePopoverOpen = usePopover(state => state.isAudioCapturePopoverOpen);
    const toggle = usePopover(state => state.toggle);

    const selfState = usePeerStateStore(state => state.selfState)
    const updateSelfState = usePeerStateStore(state => state.updateSelfState)

    const [audioProcesses, setAudioProcesses] = useState<any[]>([]);
    const [captureProcess, setCaptureProcess] = useState<string | null>(null);
    const [captureStream, setCaptureStream] = useState<MediaStream | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // useEffect(() => {
    //     if (audioRef.current) {
    //         audioRef.current.srcObject = captureStream;
    //         console.log('play audio')
    //     }
    // }, [captureStream]);

    useEffect(() => {
        if (!isAudioCapturePopoverOpen) return;

        window.ipcBridge.invoke('get-audio-sessions')
            .then((audioWindows: any) => {
                window.ipcBridge.getScreenSources()
                    .then((sources: CaptureSource[]) => {
                        console.log('sources', sources)
                        const windowSources = sources
                            .filter(source => source.id.startsWith('window:'))
                            .filter(source => source.name !== 'RelayX')
                            .map(source => ({
                                ...source,
                                audible: audioWindows.find((window: any) => (window.windowTitle === source.name) && window.isAudible)
                            }))
                        setAudioProcesses(windowSources)
                    })
            })

    }, [isAudioCapturePopoverOpen])



    const onSelectorValueChange = (processId: string) => {
        if (processId === captureProcess) return;
        if (captureProcess) {
            onStopButtonClick()
        }

        setCaptureProcess(processId)
        window.ipcBridge.send('audio-capture-id', processId)
        updateSelfState({
            isSharingAudio: true
        })
        navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: false
        })
            .then((stream) => {
                setCaptureStream(stream)
                addSource2AudioCapture(stream)
            })
    }

    const onStopButtonClick = () => {
        setCaptureProcess('');
        // toggle('isAudioCapturePopoverOpen');
        updateSelfState({
            isSharingAudio: false
        })
        captureStream?.getTracks().forEach(track => track.stop())
        setCaptureStream(null)
        addSource2AudioCapture(null)
    }

    return (
        <Popover open={isAudioCapturePopoverOpen} onOpenChange={() => toggle('isAudioCapturePopoverOpen')}>
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className={`${isAudioCapturePopoverOpen && 'z-50'} ${captureProcess && 'bg-green-800'} cursor-pointer`}
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
                    <div className='flex flex-row gap-3 items-center w-full'>
                        <div className="flex-1 min-w-0">
                            <Select
                                value={captureProcess?.toString() ?? ''}
                                onValueChange={onSelectorValueChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="select a process" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup className='bg-accent/50 rounded-md'>
                                        {audioProcesses.filter(item => item.audible).map(item =>
                                            <SelectItem value={item.id.toString()} key={item.id}>
                                                <img src={item.appIcon} alt={item.name} className='w-4 h-4' />
                                                <span>{item.name}</span>
                                            </SelectItem>
                                        )}
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel>might not have audio output</SelectLabel>
                                        {audioProcesses.filter(item => !item.audible).map(item =>
                                            <SelectItem value={item.id.toString()} key={item.id}>
                                                <img src={item.appIcon} alt={item.name} className='w-4 h-4' />
                                                <span>{item.name}</span>
                                            </SelectItem>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        {captureProcess !== null && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            onClick={onStopButtonClick}
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
                    {captureProcess !== null && captureStream && (
                        <div className="relative">
                            <AudioSpectrum
                                stream={captureStream}
                                isEnabled={isAudioCapturePopoverOpen}
                                className="h-[120px] rounded-md border-1 border-muted-foreground"
                            />

                        </div>
                    )}


                </div>
            </PopoverContent>
        </Popover>
    )
}

export default AudioCaptureSettings