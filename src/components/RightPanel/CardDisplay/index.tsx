import React, { useState, useEffect } from "react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { SelfAudioCard, SelfThumbnailCard } from "./selfCards"
import { ChevronUp, ChevronDown } from "lucide-react"
import { usePeerStateStore } from "@/stores"
import { UserAudioCard } from "./userCards"
import ControlPanel from "./controlPanel"


export default function CardDisplay({ isHovering, switchFullScreen }: { isHovering: boolean, switchFullScreen: any }) {
    const { peers } = usePeerStateStore()
    const [isScrollingUp, setIsScrollingUp] = useState(true)
    const [maximiumCard, setMaximiumCard] = useState<string | null>(null)


    return (
        <div className={`@container overflow-hidden h-full flex flex-col`}>
            {/* horizontal thumbnail cards scroll area */}
            <ScrollArea className={`w-full flex-none overflow-hidden
                transition-[max-height] duration-300 ease-in-out
                ${isScrollingUp ? 'max-h-[15cqh]' : 'max-h-0'}`
            }>
                <div className='flex justify-center w-full h-[15cqh] gap-3 p-2
                bg-white/10'>
                    {Array.from({ length: 13 }).map((_, index) => (
                        <SelfThumbnailCard />
                    ))}
                </div>

                <ScrollBar orientation="horizontal" />
            </ScrollArea>


            <div className='relative h-full w-full flex justify-center items-center min-h-0 overflow-hidden'>
                <CardGrid>
                    <SelfAudioCard
                        key="self-audio-card"
                        isMaximized={maximiumCard === 'self'}
                        onClick={() => setMaximiumCard(maximiumCard === 'self' ? null : 'self')}
                    />
                    {Object.entries(peers)
                        .filter(([peerIP, peerState]) => peerState.isInChat)
                        .map(([peerIP, peerState]) => (
                            <UserAudioCard
                                key={peerIP}
                                peerIP={peerIP}
                                peerState={peerState}
                                onClick={() => setMaximiumCard(maximiumCard === peerIP ? null : peerIP)}
                            />
                        ))}
                </CardGrid>

                {/* collapse button */}
                <div
                    className={`absolute top-0 left-1/2 -translate-x-1/2 z-20
                    ${isHovering ? 'opacity-100' : 'opacity-0'}
                    transition-opacity duration-300 ease-in-out
                    `}
                >
                    <div className="bg-white/30 p-0.5 pt-0 rounded-b-full cursor-pointer"
                        onClick={() => {
                            setIsScrollingUp(!isScrollingUp)
                        }}
                    >
                        {isScrollingUp ?
                            <ChevronUp className="w-4 h-4" /> :
                            <ChevronDown className="w-4 h-4" />
                        }
                    </div>
                </div>

                {/* control panel */}
                <div
                    className={`absolute top-0 right-0 z-20
                    ${isHovering ? 'opacity-100' : 'opacity-0'}
                    transition-opacity duration-300 ease-in-out
                    `}
                >
                    <ControlPanel switchFullScreen={switchFullScreen} />
                </div>
            </div>


        </div>
    )
}


const CardGrid = ({ children }: { children: React.ReactNode }) => {
    const numberOfCards = React.Children.count(children)

    const centeringClass = (numberOfCards >= 3 && numberOfCards % 2 !== 0)
        ? `@[400px]:[&>*:last-child]:col-span-2 @[400px]:[&>*:last-child]:justify-self-center @[400px]:[&>*:last-child]:w-1/2
         @[800px]:[&>*:last-child]:col-span-1 @[800px]:[&>*:last-child]:justify-self-auto @[800px]:[&>*:last-child]:w-full`
        : '';

    return (
        <div className={`grid gap-3 p-3 w-full 
                ${numberOfCards === 1 && 'grid-cols-1 @[600px]:grid-cols-3'}
                ${numberOfCards === 2 && 'grid-cols-1 @[400px]:grid-cols-2 @[800px]:max-w-[80%]'}
                ${numberOfCards >= 3 && 'grid-cols-1 @[800px]:grid-cols-3 @[400px]:grid-cols-2'}
                ${centeringClass}
                `}>
            {numberOfCards === 1 && <div></div>}
            {children}
        </div>
    )
}
