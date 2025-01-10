import { useState, useRef, useLayoutEffect } from 'react'
import { Settings, Pause, Volume2, AudioWaveformIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { usePopover } from "@/stores/popoverStore"
import { useAudioDeviceStore, useAudioProcessing } from '@/stores'
import AudioSpectrum from '../AudioSpectrum'


const SettingPopover = () => {
    const isSettingPopoverOpen = usePopover(state => state.isSettingPopoverOpen);
    const toggle = usePopover(state => state.toggle);
    const inputDevices = useAudioDeviceStore(state => state.inputDevices);
    const outputDevices = useAudioDeviceStore(state => state.outputDevices);
    const selectedInput = useAudioDeviceStore(state => state.selectedInput);
    const selectedOutput = useAudioDeviceStore(state => state.selectedOutput);
    const setSelectedInput = useAudioDeviceStore(state => state.setSelectedInput);
    const setSelectedOutput = useAudioDeviceStore(state => state.setSelectedOutput);
    const localFinalStream = useAudioProcessing(state => state.localFinalStream);
    const isNoiseReductionEnabled = useAudioProcessing(state => state.isNoiseReductionEnabled);
    const toggleNoiseReduction = useAudioProcessing(state => state.toggleNoiseReduction);

    const [isTesting, setIsTesting] = useState(false);
    const audioPlaybackRef = useRef<HTMLAudioElement>(null);

    return (
        <Popover
            open={isSettingPopoverOpen}
            onOpenChange={() => {
                toggle('isSettingPopoverOpen')
                setIsTesting(false)
                if (audioPlaybackRef.current) {
                    audioPlaybackRef.current.pause()
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className={isSettingPopoverOpen ? 'z-50' : ''}>
                    <Settings className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="z-50 w-[600px] ml-4 p-6 space-y-4">
                <div className='flex flex-col gap-2 '>
                    <div className="text-md flex items-center gap-2">
                        <Volume2 className="w-5 h-5" />
                        <h3 className='text-md font-bold'>Audio Device Settings</h3>
                    </div>

                    <p className='text-sm text-muted-foreground'>Configure your input and output devices</p>
                </div>

                <div className="grid gap-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium leading-none">
                            Input Device
                        </Label>
                        <Select
                            value={selectedInput}
                            onValueChange={deviceId => setSelectedInput(deviceId)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select audio input device" />
                            </SelectTrigger>
                            <SelectContent>
                                {inputDevices.map(item =>
                                    <SelectItem value={item.value} key={item.value}>
                                        {item.label}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium leading-none">
                            Output Device
                        </Label>
                        <Select
                            value={selectedOutput}
                            onValueChange={deviceId => setSelectedOutput(deviceId)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select audio Output device" />
                            </SelectTrigger>
                            <SelectContent>
                                {outputDevices.map(item =>
                                    <SelectItem value={item.value} key={item.value}>
                                        {item.label}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium leading-none">
                                Input Level
                            </label>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
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

                                {!isTesting ? 'Test Audio' : 'Stop Testing'}
                            </Button>
                        </div>
                        <div className='flex flex-col justify-start w-full'>
                            <audio
                                hidden
                                controls
                                autoPlay
                                ref={audioPlaybackRef}
                            />
                            <AudioSpectrum
                                stream={localFinalStream}
                                isEnabled={isSettingPopoverOpen}
                                className="h-[200px]"
                            />
                        </div>
                    </div>

                    <div className="flex items-start justify-between pt-4 border-t">
                        <div className="space-y-1">
                            <div className="text-sm font-medium leading-none">
                                RNN Noise Reduction
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Powered by <a href='https://jmvalin.ca/demo/rnnoise/' target='_blank' onClick={(e) => {
                                    e.preventDefault();
                                    window.ipcBridge.invoke('open-external-link', 'https://jmvalin.ca/demo/rnnoise/');
                                }}>https://jmvalin.ca/demo/rnnoise/</a>
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

            </PopoverContent>
        </Popover>
    );
}

export default SettingPopover