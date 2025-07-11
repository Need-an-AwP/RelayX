import React, { useState } from "react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { SelfAudioCard, SelfThumbnailCard } from "./selfCards"
import { ChevronUp, ChevronDown } from "lucide-react"
import { usePeerStateStore } from "@/stores"


export default function CardDisplay() {
    const { peers } = usePeerStateStore()
    const [isHovered, setIsHovered] = useState(false)
    const [isScrollingUp, setIsScrollingUp] = useState(true)
    const [maximiumCard, setMaximiumCard] = useState<string | null>(null)

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
                <CardGrid>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <SelfAudioCard
                            className={`${maximiumCard === null ? '' : maximiumCard === 'self' ? 'col-span-full' : 'hidden'}`}
                            onClick={() => {
                                if (maximiumCard === 'self') {
                                    setMaximiumCard(null)
                                } else {
                                    setMaximiumCard('self')
                                }
                            }}
                        />
                    ))}

                </CardGrid>

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
