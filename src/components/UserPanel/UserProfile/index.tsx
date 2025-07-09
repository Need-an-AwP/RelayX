import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePeerStateStore, usePopover } from '@/stores'
import { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import AvatarSelector from "./AvatarSelector"
import { LoaderCircle } from "lucide-react";



const UserProfile = () => {
    const { selfState, updateSelfState, initialized, initializeSelfState } = usePeerStateStore()
    const [isReady, setIsReady] = useState(initialized)
    const isUserPopoverOpen = usePopover(state => state.isUserPopoverOpen);
    const toggle = usePopover(state => state.toggle);
    const [localUserName, setLocalUserName] = useState(selfState.userName)
    const [localAvatar, setLocalAvatar] = useState(selfState.userAvatar)

    useEffect(() => {
        if (!initialized) {
            initializeSelfState().then(() => {
                setIsReady(true)
            })
        }
    }, [initialized, initializeSelfState])

    useEffect(() => {
        if (isUserPopoverOpen) {
            setLocalUserName(selfState.userName)
            setLocalAvatar(selfState.userAvatar)
        }
    }, [isUserPopoverOpen, selfState.userName, selfState.userAvatar])

    const handlePopoverOpenChange = (open: boolean) => {
        if (!open) {
            // Popover is closing, update the store and config
            if (localUserName !== selfState.userName || localAvatar !== selfState.userAvatar) {
                const finalUserName = localUserName.trim()
                const finalAvatar = localAvatar.trim()
                updateSelfState({ userName: finalUserName, userAvatar: finalAvatar })
            }
        }
        toggle('isUserPopoverOpen')
    }

    // 获取用户名首字母作为头像备用显示
    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : 'U'
    }

    return (
        <Popover
            open={isUserPopoverOpen}
            onOpenChange={handlePopoverOpenChange}
        >
            <PopoverTrigger asChild>
                <div className="flex items-center gap-4 cursor-pointer select-none hover:bg-secondary/60 rounded-md p-2">
                    <Avatar className="flex-shrink-0">
                        <AvatarImage src={selfState.userAvatar} />
                        <AvatarFallback>
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex w-full">
                        <span className="text-sm text-left line-clamp-2 break-all">
                            {isReady ? selfState.userName : 'Loading...'}
                        </span>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-96"
                onOpenAutoFocus={(e) => {
                    e.preventDefault()
                }}
            >
                <div className="flex flex-col gap-4">

                    <AvatarSelector currentAvatar={localAvatar} setCurrentAvatar={setLocalAvatar} />

                    <div className="flex flex-row gap-2">
                        <Label htmlFor="username" className="whitespace-nowrap">
                            User name
                        </Label>
                        <Input
                            id="username"
                            value={localUserName}
                            onChange={(e) => {
                                setLocalUserName(e.target.value)
                            }}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>

    )
}

export default UserProfile