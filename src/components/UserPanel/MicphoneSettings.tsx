import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from 'lucide-react';
import { usePeerStateStore, useAudioProcessing } from "@/stores"
import { Slider } from "@/components/ui/slider"


const MicphoneSettings = () => {
    const selfState = usePeerStateStore(state => state.selfState)
    const updateSelfState = usePeerStateStore(state => state.updateSelfState)
    const setGainValue = useAudioProcessing(state => state.setGainValue)
    const buttonRef = useRef<HTMLButtonElement>(null);

    const isMicMuted = selfState.isInputMuted
    const setIsMicMuted = (isMicMuted: boolean) => {
        updateSelfState({
            isInputMuted: isMicMuted
        })
    }

    const [volumeBeforeMute, setVolumeBeforeMute] = useState(1)
    const [inputVolume, setInputVolume] = useState(1)
    const [isTooltipOpen, setIsTooltipOpen] = useState(false)

    const setTooltipOpenWithDelay = (isOpen: boolean) => {
        setTimeout(() => {
            setIsTooltipOpen(isOpen)
        }, 100)
    }

    return (
        <div className="relative">
            <Button
                ref={buttonRef}
                size="icon"
                variant={`${isMicMuted ? 'destructive' : 'ghost'}`}
                onMouseEnter={() => setTooltipOpenWithDelay(true)}
                onMouseLeave={() => setIsTooltipOpen(false)}
                onClick={() => {
                    if (isMicMuted) {
                        setInputVolume(volumeBeforeMute)
                        setGainValue(volumeBeforeMute)
                    } else {
                        setVolumeBeforeMute(inputVolume)
                        setInputVolume(0)
                        setGainValue(0)
                    }
                    setIsMicMuted(!isMicMuted);
                }}>
                {isMicMuted ? (
                    <MicOff className="h-4 w-4" />
                ) : isTooltipOpen ? (
                    <div className="h-4 w-4 flex items-center justify-center text-xs font-medium">
                        {Math.round(inputVolume * 100)}
                    </div>
                ) : (
                    <Mic className="h-4 w-4" />
                )}
            </Button>

            {isTooltipOpen && (
                <div
                    className={`absolute bottom-full z-50 left-1/2 -translate-x-1/2
                        ${isMicMuted ? 'hidden' : ''}`}
                    onMouseEnter={() => setTooltipOpenWithDelay(true)}
                    onMouseLeave={() => setIsTooltipOpen(false)}
                >
                    <div className='h-[200px] w-full bg-neutral-800 mb-1 px-4 py-4 rounded-md'>
                        <Slider
                            min={0}
                            max={2}
                            step={0.01}
                            value={[inputVolume]}
                            orientation="vertical"
                            onValueChange={(value) => {
                                setInputVolume(value[0])
                                setGainValue(value[0])
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default MicphoneSettings