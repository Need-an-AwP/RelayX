import { Airplay, Mic } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import HanupMotionIcon from "./HanupMotionIcon";
import { useCurrentUser, useChannel } from '@/stores'

const InVoiceChannelPanel = () => {
    const user = useCurrentUser((state) => state.user)
    const inVoiceChannel = useCurrentUser((state) => state.inVoiceChannel)
    const isScreenSharing = useCurrentUser((state) => state.isScreenSharing)
    const setInVoiceChannel = useCurrentUser((state) => state.setInVoiceChannel)
    const removeUser = useChannel((state) => state.removeUser)

    const handleHangup = () => {
        removeUser(inVoiceChannel!.id, user!.id)
        setInVoiceChannel(null)
    }

    if (inVoiceChannel) {
        return (
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 ml-2 my-2 text-sm text-green-400">
                    {inVoiceChannel.name}
                </div>

                <div>
                    <TooltipProvider delayDuration={50}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                // onClick={() => joinScreenShare()}
                                >
                                    <Airplay className={`h-4 w-4 ${isScreenSharing ? 'text-green-400' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Share Screen</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={50}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleHangup()}
                                >
                                    <HanupMotionIcon size={16} />
                                </Button>
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