import { useEffect, useState } from "react"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDB } from "@/stores"
import AvatarSelector from "./AvatarSelector"

const UserProfile = () => {
    const selfConfig = useDB((state) => state.selfConfig)
    const setSelfConfig = useDB((state) => state.setSelfConfig)
    const updateUserConfig = useDB((state) => state.updateUserConfig)

    const [currentAvatar, setCurrentAvatar] = useState<string>("")
    const [currentName, setCurrentName] = useState<string>("")
    useEffect(() => {
        if (selfConfig) {
            setCurrentAvatar(selfConfig.user_avatar)
            setCurrentName(selfConfig.user_name)
        }
    }, [selfConfig])

    if (!selfConfig) return null;

    const handleSave = () => {
        const newConfig = {
            ...selfConfig,
            user_name: currentName,
            user_avatar: currentAvatar
        };
        setSelfConfig(newConfig)    // change global state
        updateUserConfig(newConfig)    // update db
    }


    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="flex items-center gap-4 cursor-pointer hover:bg-secondary/60 rounded-md p-2">
                    <Avatar className="flex-shrink-0">
                        <AvatarImage src={selfConfig.user_avatar} />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="flex w-full">
                        <span className="text-sm text-left line-clamp-2 break-all">
                            {selfConfig.user_name}
                        </span>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" showCloseIcon={false}>
                <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-[auto,1fr] items-center gap-4">
                        {/* 
                        <Label>Set a State</Label>
                        <LottieEmoji
                            currentState={currentState}
                            setCurrentState={setCurrentState}
                        /> */}

                        <AvatarSelector
                            currentAvatar={currentAvatar}
                            onAvatarChange={setCurrentAvatar}
                        />

                        <Label htmlFor="username" className="text-right">
                            Username
                        </Label>
                        <Input
                            id="username"
                            defaultValue={selfConfig.user_name}
                            onChange={(e) => {
                                setCurrentName(e.target.value)
                            }}
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-between mt-10">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            type="submit"
                            onClick={handleSave}
                            disabled={currentName === selfConfig.user_name && currentAvatar === selfConfig.user_avatar}
                        >
                            Save changes
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default UserProfile