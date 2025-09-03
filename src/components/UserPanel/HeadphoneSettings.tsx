import { useState, useRef, useEffect } from "react";
import { Headphones, HeadphoneOff } from 'lucide-react'
import { Button } from "@/components/ui/button";
import { useLocalUserStateStore, useMediaStore } from "@/stores"
import { Slider } from "@/components/ui/slider"


const HeadphoneSettings = () => {
    const {userState, updateSelfState} = useLocalUserStateStore()
    const setOutputGainValue = useMediaStore(state => state.setOutputGainValue)
    const buttonRef = useRef<HTMLButtonElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const isHeadphoneMuted = userState.isOutputMuted
    const setIsHeadphoneMuted = (isHeadphoneMuted: boolean) => {
        updateSelfState({
            isOutputMuted: isHeadphoneMuted
        })
    }

    const [volumeBeforeMute, setVolumeBeforeMute] = useState(1)
    const [outputVolume, setOutputVolume] = useState(1)
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
                variant={`${isHeadphoneMuted ? 'destructive' : 'ghost'}`}
                onClick={() => {
                    if (isHeadphoneMuted) {
                        setOutputVolume(volumeBeforeMute)
                        setOutputGainValue(volumeBeforeMute)
                    } else {
                        setVolumeBeforeMute(outputVolume)
                        setOutputVolume(0)
                        setOutputGainValue(0)
                    }
                    setIsHeadphoneMuted(!isHeadphoneMuted)
                }}>
                {isHeadphoneMuted ? (
                    <HeadphoneOff className="h-4 w-4" />
                ) : isTooltipOpen ? (
                    <div className="h-4 w-4 flex items-center justify-center text-xs font-medium">
                        {Math.round(outputVolume * 100)}
                    </div>
                ) : (
                    <Headphones className="h-4 w-4" />
                )}
            </Button>

            {isTooltipOpen && (
                <div
                    className={`absolute bottom-full z-50 left-1/2 -translate-x-1/2
                        ${isHeadphoneMuted ? 'hidden' : ''}`}
                >
                    <div className='h-[200px] w-full bg-neutral-800 mb-1 px-4 py-4 rounded-md'>
                        <Slider
                            min={0}
                            max={2}
                            step={0.01}
                            value={[outputVolume]}
                            orientation="vertical"
                            onValueChange={(value) => {
                                setOutputVolume(value[0])
                                setOutputGainValue(value[0])
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default HeadphoneSettings