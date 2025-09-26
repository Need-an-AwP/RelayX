import { useState, useRef, useEffect } from "react";
import { Headphones, HeadphoneOff } from 'lucide-react'
import { Button } from "@/components/ui/button";
import { useAudioStore } from "@/stores"
import { Slider } from "@/components/ui/slider"


const HeadphoneSettings = () => {
    const { mainVolume, mainMuted, setMainVolume, toggleMute } = useAudioStore();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
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
                variant={`${mainMuted ? 'destructive' : 'ghost'}`}
                onClick={toggleMute}
            >
                {mainMuted ? (
                    <HeadphoneOff className="h-4 w-4" />
                ) : isTooltipOpen ? (
                    <div className="h-4 w-4 flex items-center justify-center text-xs font-medium">
                        {Math.round(mainVolume * 100)}
                    </div>
                ) : (
                    <Headphones className="h-4 w-4" />
                )}
            </Button>

            {isTooltipOpen && (
                <div
                    className={`absolute bottom-full z-50 left-1/2 -translate-x-1/2
                        ${mainMuted ? 'hidden' : ''}`}
                >
                    <div className='h-[200px] w-full bg-neutral-800 mb-1 px-4 py-4 rounded-md'>
                        <Slider
                            min={0}
                            max={2}
                            step={0.01}
                            value={[mainVolume]}
                            orientation="vertical"
                            onValueChange={(value) => {
                                const newVolume = value[0]
                                setMainVolume(newVolume)

                                if (newVolume > 0 && mainMuted) {
                                    // 如果手动调整音量且当前是静音状态，则取消静音
                                    toggleMute()
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default HeadphoneSettings