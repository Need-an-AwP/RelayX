import { useEffect, useRef, useState } from 'react';
import { useScreenShare, useCurrentUser } from '@/stores'
import { SquareX, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoundButton } from '@/components/ui/round-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import VideoWindow from './VideoWindow';


const StreamDisplay = () => {
    const { stream, setStream } = useScreenShare((state) => state)
    const setIsScreenSharing = useCurrentUser((state) => state.setIsScreenSharing)
    const containerRef = useRef<HTMLDivElement>(null);
    const [isControlVisible, setIsControlVisible] = useState(false);


    const stopCapture = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setIsScreenSharing(false)
    };

    const replaceVideoTracks = () => {

    }


    return (
        <div
            className="relative flex flex-col w-full h-full min-h-0 items-center justify-center p-8"
            onMouseEnter={() => setIsControlVisible(true)}
            onMouseLeave={() => setIsControlVisible(false)}
            ref={containerRef}
        >

            <VideoWindow stream={stream} containerRef={containerRef} />

            <div className={`absolute flex items-center justify-center gap-4
                bottom-0 w-full h-[90px] bg-[#121212] bg-opacity-30 backdrop-blur-sm
                transition-transform duration-300 ease-in-out
                ${isControlVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <RoundButton onClick={() => stopCapture()}>
                                <SquareX className="w-6 h-6" />
                            </RoundButton>
                        </TooltipTrigger>
                        <TooltipContent>Close Screen Share</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <RoundButton variant="destructive">
                                <Power className="w-6 h-6" />
                            </RoundButton>
                        </TooltipTrigger>
                        <TooltipContent>Close Voice Chat</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

            </div>
        </div>
    );
};

export default StreamDisplay;