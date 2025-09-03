import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from 'lucide-react';
import { useLocalUserStateStore, useAudioProcessing } from "@/stores"
import { Slider } from "@/components/ui/slider"


const MicphoneSettings = () => {
    const { userState, updateSelfState } = useLocalUserStateStore()

    const setGainValue = useAudioProcessing(state => state.setGainValue)
    const buttonRef = useRef<HTMLButtonElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const isMicMuted = userState.isInputMuted
    const setIsMicMuted = (isMicMuted: boolean) => {
        updateSelfState({
            isInputMuted: isMicMuted
        })
    }

    const [volumeBeforeMute, setVolumeBeforeMute] = useState(1)
    const [inputVolume, setInputVolume] = useState(1)
    const [isTooltipOpen, setIsTooltipOpen] = useState(false)

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        setIsTooltipOpen(true)
    }

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsTooltipOpen(false)
        }, 100)
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Button
                ref={buttonRef}
                size="icon"
                variant={`${isMicMuted ? 'destructive' : 'ghost'}`}
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