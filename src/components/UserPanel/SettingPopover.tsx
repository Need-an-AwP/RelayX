import { useState, useRef, useLayoutEffect } from 'react'
import { Settings, Pause, Volume2, AudioWaveformIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAudioDeviceStore, useAudioProcessing, usePopover } from '@/stores'
import UserAudioSpectrum from '@/components/UserAudioSpectrum'


const SettingPopover = () => {
    const { activePopover, togglePopover } = usePopover();
    const isSettingOpen = activePopover === 'setting';
    const {
        inputDevices,
        outputDevices,
        selectedInput,
        selectedOutput,
        setSelectedInput,
        setSelectedOutput
    } = useAudioDeviceStore()
    const { localFinalStream, analyser, isNoiseReductionEnabled, toggleNoiseReduction } = useAudioProcessing()

    const [isTesting, setIsTesting] = useState(false);
    const audioPlaybackRef = useRef<HTMLAudioElement>(null);
    const shouldShowAboveOverlay = `${(!activePopover || isSettingOpen) && 'z-50'}`;

    return (
        <Popover
            open={isSettingOpen}
            onOpenChange={() => {
                togglePopover('setting')

                setIsTesting(false)
                if (audioPlaybackRef.current) {
                    audioPlaybackRef.current.pause()
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    variant={`${isSettingOpen ? 'outline' : 'ghost'}`}
                    className={`${shouldShowAboveOverlay} cursor-pointer`}
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="relative z-50 w-[400px] p-4 space-y-4 mx-4">
                <div className='relative z-10 flex flex-row gap-2 justify-between'>
                    <h3 className='text-md font-bold'>Audio Device Settings</h3>
                    <TooltipProvider>
                        <Tooltip disableHoverableContent>
                            <TooltipTrigger
                                asChild
                                onFocus={(e) => e.preventDefault()}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 cursor-pointer"
                                    onClick={() => {
                                        if (audioPlaybackRef.current && localFinalStream) {
                                            audioPlaybackRef.current.srcObject = localFinalStream;
                                            if (isTesting) {
                                                audioPlaybackRef.current.pause();
                                            } else {
                                                audioPlaybackRef.current.play();
                                            }
                                            setIsTesting(!isTesting);
                                        }
                                    }}
                                >
                                    {isTesting ?
                                        <Pause className="w-4 h-4" />
                                        :
                                        <AudioWaveformIcon className="w-4 h-4" />
                                    }

                                    {!isTesting ? 'Enable Sidetone' : 'Stop Testing'}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>It is highly recommended to use headphones when testing audio feedback</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="relative z-10 grid gap-4 mb-0">
                    <div className="space-y-2 min-w-0">
                        <Label className="text-sm font-medium leading-none">
                            Input Device
                        </Label>
                        <Select
                            value={selectedInput}
                            onValueChange={deviceId => setSelectedInput(deviceId)}
                        >
                            <SelectTrigger className="truncate w-full">
                                <SelectValue placeholder="Select audio input device" />
                            </SelectTrigger>
                            <SelectContent>
                                {inputDevices.map(item =>
                                    <SelectItem value={item.value} key={item.value} className="truncate">
                                        {item.label}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 min-w-0">
                        <Label className="text-sm font-medium leading-none">
                            Output Device
                        </Label>
                        <Select
                            value={selectedOutput}
                            onValueChange={deviceId => setSelectedOutput(deviceId)}
                        >
                            <SelectTrigger className="truncate w-full">
                                <SelectValue placeholder="Select audio Output device" />
                            </SelectTrigger>
                            <SelectContent>
                                {outputDevices.map(item =>
                                    <SelectItem value={item.value} key={item.value} className="truncate">
                                        {item.label}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between pt-4 px-1 border-t">
                        <div className="space-y-1">
                            <div className="text-sm font-medium leading-none">
                                RNN Noise Reduction
                            </div>
                            <p className="text-xs text-muted-foreground">
                                From <a
                                    href='https://jmvalin.ca/demo/rnnoise/'
                                    target='_blank'
                                    rel="noopener noreferrer"
                                    className="text-blue-500"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.ipcBridge.openURL('https://jmvalin.ca/demo/rnnoise/');
                                    }}>xiph.org RNNoise</a>
                            </p>

                        </div>
                        <Switch
                            checked={isNoiseReductionEnabled}
                            onCheckedChange={(res) => {
                                toggleNoiseReduction(res);
                            }}
                        />
                    </div>
                </div>

                <div className="absolute top-0 left-0 w-full h-full z-0">
                    <audio
                        hidden
                        controls
                        autoPlay
                        ref={audioPlaybackRef}
                    />
                    {analyser &&
                        <UserAudioSpectrum
                            renderId='setting-popover'
                            analyser={analyser}
                            className="h-full w-full rounded-md opacity-50"
                            displayStyle='bar'
                        />
                    }
                </div>

            </PopoverContent>
        </Popover>
    );
}

export default SettingPopover