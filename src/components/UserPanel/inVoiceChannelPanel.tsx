import { useState } from 'react';
import { Airplay } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import HangupButton from "./HangupButton";
import { useCurrentUser, useChannel } from '@/stores'

const InVoiceChannelPanel = () => {
    const user = useCurrentUser((state) => state.user)
    const inVoiceChannel = useCurrentUser((state) => state.inVoiceChannel)
    const isScreenSharing = useCurrentUser((state) => state.isScreenSharing)
    const setInVoiceChannel = useCurrentUser((state) => state.setInVoiceChannel)
    const setIsScreenSharing = useCurrentUser((state) => state.setIsScreenSharing)
    const removeUser = useChannel((state) => state.removeUser)
    const [displayQuitDialog, setDisplayQuitDialog] = useState(false)

    const joinScreenShare = () => {
        if (isScreenSharing) {
            setDisplayQuitDialog(true)
            return
        }
        setIsScreenSharing(true)
    }

    const handleHangup = () => {
        removeUser(inVoiceChannel!.id, user!.id)
        setInVoiceChannel(null)
        setIsScreenSharing(false)
    }

    if (inVoiceChannel) {
        return (
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 ml-2 my-2 text-sm text-green-400">
                    {inVoiceChannel.name}
                </div>

                <div>
                    <Dialog
                        open={displayQuitDialog}
                        onOpenChange={(open) => setDisplayQuitDialog(open)}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>End Screen Sharing</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to end screen sharing?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDisplayQuitDialog(false)}>Cancel</Button>
                                <Button
                                    onClick={() => {
                                        setIsScreenSharing(false)
                                        setDisplayQuitDialog(false)
                                    }}>End</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>


                    <TooltipProvider delayDuration={50}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => joinScreenShare()}
                                >
                                    <Airplay className={`h-4 w-4 ${isScreenSharing ? 'text-green-400' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Share Screen</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HangupButton onClick={handleHangup} />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Hangup</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                </div>
            </div>
        );
    } else {
        return null;
    }
}

export default InVoiceChannelPanel