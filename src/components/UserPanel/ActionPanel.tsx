import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, PhoneOff, Airplay, LoaderCircle  } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePeerStateStore } from "@/stores"

const ActionPanel = () => {
    const selfState = usePeerStateStore(state => state.selfState)
    const updateSelfState = usePeerStateStore(state => state.updateSelfState)
    const [isLoading, setIsLoading] = useState(false)

    return (
        <TooltipProvider>
            <div className={`grid items-center space-x-2 transition-[grid-template-columns] duration-300 ease-in-out ${selfState.isInChat ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)]' : 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'}`}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            className={` cursor-pointer transition-all duration-300
                                ${selfState.isInChat ? '!bg-red-600/60 hover:!bg-red-600' : 'hover:!bg-green-600'}`}
                            onClick={() => {
                                if (selfState.isInChat) {
                                    updateSelfState({
                                        isInChat: false
                                    })
                                } else {
                                    setIsLoading(true)
                                    setTimeout(() => {
                                        setIsLoading(false)
                                        updateSelfState({
                                            isInChat: true
                                        })
                                    }, 500)
                                }
                            }}
                        >
                            {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : selfState.isInChat ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{selfState.isInChat ? 'leave chat' : 'join chat'}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            className={`hover:!bg-neutral-500 cursor-pointer transition-all duration-300`}
                        // disabled={true}
                        >
                            <Airplay className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {selfState.isInChat ? <p>start screen sharing</p> : <p>join with screen</p>}
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}

export default ActionPanel;
