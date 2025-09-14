import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoaderCircle, ChevronDown } from "lucide-react";
import { RiVoiceprintLine } from "react-icons/ri";
import { BsPersonVideo3 } from "react-icons/bs";
import { useLocalUserStateStore } from "@/stores"


export default function SelfThumbnailCard({ className }: { className?: string }) {
    const { userState: selfState } = useLocalUserStateStore()
    const [open, setOpen] = useState(false)

    return (
        <Card
            className={`relative h-full aspect-video select-none p-4 
                        transition-all duration-300 flex justify-center items-center overflow-hidden
                        hover:border-primary hover:ring-1 
                        ${className}`}
        >
            <div className="flex h-full justify-center items-center gap-4 aspect-square p-2 z-10">
                <Avatar className="flex-shrink-0 h-full w-full">
                    <AvatarImage src={selfState.userAvatar} draggable={false} />
                    <AvatarFallback>
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                    </AvatarFallback>
                </Avatar>
            </div>

            <div className={`absolute top-0 left-0 w-full h-full z-20
                        flex justify-center items-center
                        bg-muted opacity-0
                        hover:opacity-60 transition-opacity duration-300`} >
                <ChevronDown className="w-4 h-4" />
            </div>
        </Card>
    )
}
