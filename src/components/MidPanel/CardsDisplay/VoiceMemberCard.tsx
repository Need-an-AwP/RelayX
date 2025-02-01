import { useState } from "react"
import { useTailscale, useAudioProcessing, useMediaStream } from "@/stores"
import type { User } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EyeOff, Eye } from 'lucide-react';
import AudioSpectrum from '@/components/AudioSpectrum'

interface VoiceMemberCardProps {
    isSelf: boolean;
    member: User;
    cardIndex?: number;
    totalCardsCount?: number;
    onClick?: () => void;
    className?: string;
}

const VoiceMemberCard = ({ isSelf, member, cardIndex = -1, totalCardsCount = 0, onClick, className }: VoiceMemberCardProps) => {
    const [isHover, setIsHover] = useState(false);
    const [showSpectrum, setShowSpectrum] = useState(true);
    const localFinalStream = useAudioProcessing(state => state.localFinalStream);

    const receivedStreams = useMediaStream((state) => state.receivedAudioStream);
    const remoteStream = receivedStreams[member.IPs.ipv4!];

    return (
        <Card
            key={member.id}
            className={`aspect-video relative z-30 w-full
                ${cardIndex === totalCardsCount - 1 && totalCardsCount % 2 === 1 && totalCardsCount > 1 &&
                '@md:col-span-2 @md:w-[50%] mx-auto'}
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
            {/* main avatar */}
            <div className="relative z-30 flex flex-col justify-center items-center h-full w-full">
                <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name?.slice(0, 2)}</AvatarFallback>
                </Avatar>
            </div>
            {/* name tag */}
            <div className={`absolute z-30 top-2 right-2 bg-zinc-600/50 rounded-md py-[6px] px-[12px]
            ${isHover ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ease-in-out
             text-sm`}>
                <span>{member.name}</span>
            </div>
            {/* spectrum display switch */}
            <div
                className={`absolute z-40 top-2 left-2 bg-zinc-600/50 rounded-md py-[6px] px-[12px]
                    ${isHover ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ease-in-out
                    text-sm
                    cursor-pointer hover:bg-zinc-800/80`}
                onClick={(e) => {
                    e.stopPropagation();
                    setShowSpectrum(!showSpectrum);
                }}
                title="switch spectrum display"
            >
                {showSpectrum ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </div>
            {/* spectrum display */}
            {showSpectrum && <div className="absolute top-0 left-0 z-10 w-full h-full">
                <AudioSpectrum
                    stream={isSelf ? localFinalStream : remoteStream}
                    isEnabled={showSpectrum}
                    className={`
                        h-full w-full bg-transparent
                        ${isHover ? 'opacity-90' : 'opacity-30'} transition-opacity duration-300 ease-in-out
                    `}
                />
            </div>}
        </Card>
    )
}

export default VoiceMemberCard