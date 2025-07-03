import { useEffect, useRef, useState } from "react";
import { Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Rnd } from 'react-rnd'


interface StreamStats {
    displaySurface?: string;
    deviceId?: string;
    width?: number;
    height?: number;
    frameRate?: number;
}

const VideoWindow = ({ stream, containerRef }: { stream: MediaStream | null, containerRef: React.RefObject<HTMLDivElement | null> }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [streamStats, setStreamStats] = useState<StreamStats | null>(null);
    const [isVideoInfoDisplayed, setIsVideoInfoDisplayed] = useState(false);
    const [previousState, setPreviousState] = useState<{
        size: { width: number; height: number };
        position: { x: number; y: number };
    } | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);


    useEffect(() => {
        if (!videoRef.current && !stream) return;

        videoRef.current!.srcObject = stream;

        const statsInterval = setInterval(() => {
            if (!videoRef.current) return;
            const videoTrack = stream!.getVideoTracks()[0]
            const { deviceId, width, height, frameRate, displaySurface } = videoTrack.getSettings();
            // console.log(videoTrack.getSettings());
            setStreamStats(prev => ({
                ...prev,
                displaySurface,
                deviceId,
                width,
                height,
                frameRate,
            }));
        }, 1000);

        return () => {
            clearInterval(statsInterval);
        };
    }, [stream]);


    const handleExpand = () => {
        if (!containerRef.current) return;

        if (!isExpanded) {
            // 保存当前状态
            // 展开到最大尺寸
        } else if (previousState) {
            // 恢复到之前的状态
        }

        setIsExpanded(!isExpanded);
    };


    return (
        <Rnd
            minWidth={50}
            disableDragging={isExpanded}
            enableResizing={!isExpanded}
        >
            <div className="relative overflow-hidden rounded-lg border-4 border-yellow-500">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-[calc(100vh-8rem)] object-contain"
                />
                <div className="absolute bottom-2 left-2">
                    <Button
                        variant={isVideoInfoDisplayed ? "secondary" : "ghost"}
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => setIsVideoInfoDisplayed(!isVideoInfoDisplayed)}
                    >
                        <Info />
                    </Button>
                </div>
                {(isVideoInfoDisplayed && streamStats) && (
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-white space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-500">displaySurface:</span>
                            <span>{streamStats.displaySurface}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-500">deviceId:</span>
                            <span>{streamStats.deviceId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-500">Resolution:</span>
                            <span>{streamStats.width}*{streamStats.height}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-500">frameRate:</span>
                            <span>{streamStats.frameRate}</span>
                        </div>
                    </div>
                )}
            </div>
        </Rnd>
    );
};

export default VideoWindow;