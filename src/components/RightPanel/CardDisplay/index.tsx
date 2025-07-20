import React, { useState, useEffect } from "react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { SelfAudioCard, SelfThumbnailCard } from "./selfCards"
import { ChevronUp, ChevronDown } from "lucide-react"
import { usePeerStateStore } from "@/stores"
import { UserAudioCard } from "./userCards"


export default function CardDisplay() {
    const { peers } = usePeerStateStore()
    const [isHovered, setIsHovered] = useState(false)
    const [isScrollingUp, setIsScrollingUp] = useState(true)
    const [maximiumCard, setMaximiumCard] = useState<string | null>(null)


    useEffect(() => {
        console.log('maximiumCard', maximiumCard)
    }, [maximiumCard])

    return (
        <div
            className={`@container overflow-hidden h-full flex flex-col`}
            onMouseEnter={() => {
                setIsHovered(true)
            }}
            onMouseLeave={() => {
                setIsHovered(false)
            }}
        >

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
                {maximiumCard === null ? (
                    <CardGrid>
                        
                        {Array.from({ length: 9 }).map((_, index) => (
                            <SelfAudioCard
                            onClick={() => {
                                setMaximiumCard('self')
                            }}
                        />
                        ))}
                        {Object.entries(peers)
                            .filter(([peerIP, peerState]) => peerState.isInChat)
                            .map(([peerIP, peerState]) => (
                                <UserAudioCard
                                    key={peerIP}
                                    peerIP={peerIP}
                                    peerState={peerState}
                                    onClick={() => {
                                        setMaximiumCard(peerIP)
                                    }}
                                />
                            ))}
                        
                    </CardGrid>
                ) : (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="w-[95%]">
                            <SelfAudioCard
                                className="w-full h-full"
                                onClick={() => {
                                    setMaximiumCard(null)
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* collapse button */}
                {isHovered && <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
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
                </div>}
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
