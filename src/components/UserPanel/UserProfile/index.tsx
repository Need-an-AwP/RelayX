import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLocalUserStateStore, usePopover } from '@/stores'
import { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import AvatarSelector from "./AvatarSelector"
import { LoaderCircle, X } from "lucide-react";



const UserProfile = () => {
    const { userState, updateSelfState, initialized, initializeSelfState } = useLocalUserStateStore()
    const [isReady, setIsReady] = useState(initialized)
    const isUserPopoverOpen = usePopover(state => state.isUserPopoverOpen);
    const toggle = usePopover(state => state.toggle);
    const [localUserName, setLocalUserName] = useState(userState.userName)
    const [localAvatar, setLocalAvatar] = useState(userState.userAvatar)

    useEffect(() => {
        if (!initialized) {
            initializeSelfState().then(() => {
                setIsReady(true)
            })
        }
    }, [initialized, initializeSelfState])

    useEffect(() => {
        if (isUserPopoverOpen) {
            setLocalUserName(userState.userName)
            setLocalAvatar(userState.userAvatar)
        }
    }, [isUserPopoverOpen, userState.userName, userState.userAvatar])

    const handlePopoverOpenChange = (open: boolean) => {
        if (!open) {
            // Popover is closing, update the store and config
            if (localUserName !== userState.userName || localAvatar !== userState.userAvatar) {
                const finalUserName = localUserName.trim()
                const finalAvatar = localAvatar.trim()
                updateSelfState({ userName: finalUserName, userAvatar: finalAvatar })
            }
        }
        toggle('isUserPopoverOpen')
    }

    // 检查是否有有效的更改
    const hasChanges = () => {
        const trimmedUserName = localUserName.trim()
        const trimmedAvatar = localAvatar.trim()
        return trimmedUserName !== userState.userName || trimmedAvatar !== userState.userAvatar
    }

    // 放弃所有更改
    const discardChanges = () => {
        setLocalUserName(userState.userName)
        setLocalAvatar(userState.userAvatar)
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
                        <AvatarImage src={userState.userAvatar} draggable={false} />
                        <AvatarFallback>
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex w-full">
                        <span className="text-sm text-left line-clamp-2 break-all">
                            {isReady ? userState.userName : 'Loading...'}
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
                <div className="relative flex flex-col gap-4">
                    {hasChanges() && (
                        <div className="absolute top-0 right-0">
                            <TooltipProvider>
                                <Tooltip disableHoverableContent>
                                    <TooltipTrigger
                                        asChild
                                        onFocus={(e) => e.preventDefault()}
                                    >
                                        <Button variant="destructive" size="icon" onClick={discardChanges}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Discard all changes<br />
                                        Click outside popover to save changes
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
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