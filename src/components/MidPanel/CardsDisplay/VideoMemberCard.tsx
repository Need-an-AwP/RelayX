import { useEffect, useRef, useState } from "react";
import { Info } from 'lucide-react'
import type { User } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMediaStream, useScreenShare } from "@/stores"; // 引入需要的 store

interface StreamStats {
    displaySurface?: string;
    deviceId?: string;
    width?: number;
    height?: number;
    frameRate?: number;
}

interface VideoMemberCardProps {
    isSelf: boolean;
    member: User;
    index: number;
    membersLength: number;
    onClick?: () => void;
    className?: string;
}

const VideoMemberCard = ({ isSelf, member, index, membersLength, onClick, className }: VideoMemberCardProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [streamStats, setStreamStats] = useState<StreamStats | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const [isHover, setIsHover] = useState(false);

    const screenShareStream = useScreenShare((state) => state.stream);
    const receivedVideoStream = useMediaStream((state) => state.receivedVideoStream);
    const remoteVideoStream = receivedVideoStream[member.IPs.ipv4!];

    const stream = isSelf ? screenShareStream : remoteVideoStream;

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

    return (
        <Card
            key={member.id}
            className={`aspect-video relative z-30 w-full 
                    ${index === membersLength - 1 && membersLength % 2 === 1 && membersLength !== 1
                && '@md:col-span-2 @md:w-[50%] mx-auto'}
                ${className}
                `}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            onClick={onClick}
        >
            {/* self indicator */}
            {isSelf && (
                <div className="absolute z-30 rounded-md inset-0 border-2 border-cyan-700/30 pointer-events-none"></div>
            )}
            {/* name tag */}
            <div className={`absolute z-30 top-2 right-2 bg-zinc-600/50 rounded-md py-[6px] px-[12px]
            ${isHover ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ease-in-out
             text-sm`}>
                <span>{member.name}</span>
            </div>
            {/* video info display switch */}
            <div
                className={`absolute z-40 top-2 left-2 bg-zinc-600/50 rounded-md py-[6px] px-[12px]
                    ${isHover ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ease-in-out
                    text-sm 
                    cursor-pointer hover:bg-zinc-800/80
                    `}
                onClick={(e) => {
                    e.stopPropagation();
                    setShowInfo(!showInfo);
                }}
                title="switch video info display"
            >
                {showInfo && streamStats ? <div className="text-xs text-left">
                    <span className="text-yellow-500">displaySurface: </span>
                    <span>{streamStats.displaySurface}</span>
                    <br />
                    <span className="text-yellow-500">deviceId: </span>
                    <span>{streamStats.deviceId}</span>
                    <br />
                    <span className="text-yellow-500">resolution: </span>
                    <span>{streamStats.width}*{streamStats.height}</span>
                    <br />
                    <span className="text-yellow-500">frameRate: </span>
                    <span>{streamStats.frameRate}</span>
                </div> : <Info className="w-4 h-4" />}
            </div>
            {/* video display */}
            <div className="relative z-10 flex flex-col justify-center items-center h-full w-full p-0.5">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full object-contain"
                />
            </div>
        </Card>
    )
}

export default VideoMemberCard