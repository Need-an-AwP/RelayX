import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import SelfAudioCard from "./SelfAudioCard"
import { ChevronUp, ChevronDown } from "lucide-react"



export default function CardDisplay() {
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

            <ScrollArea className={`relative w-full flex-none overflow-hidden
                transition-[max-height] duration-300 ease-in-out
                ${isScrollingUp ? 'max-h-[15cqh]' : 'max-h-0'}`
            }>
                <div className='flex justify-center w-full h-[15cqh] gap-3 p-2
                bg-white/10'>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card
                            key={index}
                            className='p-4 h-full aspect-video
                                transition-all duration-300 
                                hover:border-primary 
                                hover:ring-2
                                hover:bg-muted'>
                            <h1>Card {index + 1}</h1>
                        </Card>
                    ))}
                </div>

                <ScrollBar orientation="horizontal" />
            </ScrollArea>


            <div className='relative h-full w-full flex place-items-center min-h-0 overflow-hidden'>
                <div className='grid gap-3 p-3 w-full
                grid-cols-1 @[800px]:grid-cols-3 @[400px]:grid-cols-2'>

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
                </div>

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
