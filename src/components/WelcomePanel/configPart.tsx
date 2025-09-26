import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoaderCircle, X } from "lucide-react";
import AvatarSelector from "@/components/UserPanel/UserProfile/AvatarSelector"
import { useLocalUserStateStore } from '@/stores'

export default function ConfigPart() {
    const { userState, updateSelfState, initialized, initializeSelfState } = useLocalUserStateStore()
    const [isReady, setIsReady] = useState(initialized)
    const setAvatar = (newAvatar: string | ((prevAvatar: string) => string)) => {
        const newValue = typeof newAvatar === 'function' ? newAvatar(userState.userAvatar) : newAvatar;
        updateSelfState({ userAvatar: newValue })
    }

    return (
        <div className="flex flex-col w-full items-end pr-4 -space-y-5">
            <Popover>
                <PopoverTrigger asChild>
                    <Avatar className={`flex-shrink-0 w-40 h-40 cursor-pointer hover:opacity-80`}>
                        <AvatarImage src={isReady ? userState.userAvatar : ''} draggable={false} />
                        <AvatarFallback>
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                        </AvatarFallback>
                    </Avatar>
                </PopoverTrigger>
                <PopoverContent
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <AvatarSelector currentAvatar={userState.userAvatar} setCurrentAvatar={setAvatar} />
                </PopoverContent>
            </Popover>

            <div className="flex flex-col gap-2 w-4/5">
                <Label htmlFor="username" className="text-base font-medium whitespace-nowrap">
                    User name
                </Label>
                <Input
                    id="username"
                    placeholder="Enter your user name"
                    value={userState.userName}
                    onChange={(e) => {
                        updateSelfState({ userName: e.target.value })
                    }}
                />
                <p className="text-sm text-muted-foreground">
                    identify yourself in the app
                </p>
            </div>
        </div>
    )
}