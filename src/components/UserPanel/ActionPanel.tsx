import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, PhoneOff, Airplay, LoaderCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { usePeerStateStore, useDesktopCapture } from "@/stores"
import { MdMonitor, MdCameraAlt } from "react-icons/md";


const ActionPanel = () => {
    const selfState = usePeerStateStore(state => state.selfState)
    const updateSelfState = usePeerStateStore(state => state.updateSelfState)
    const requestSources = useDesktopCapture(state => state.requestSources)
    const setIsSelectingSource = useDesktopCapture(state => state.setIsSelectingSource)
    const [isLoading, setIsLoading] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const screenshareOnClick = () => {
        setIsDropdownOpen(false)
        setIsSelectingSource(true)
        requestSources()
    }


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

                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`hover:!bg-neutral-500 cursor-pointer transition-all duration-300`}
                                >
                                    <Airplay className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            {selfState.isInChat ? <p>start screen sharing</p> : <p>join with screen</p>}
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent side="top" align="center">
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={screenshareOnClick}
                        >
                            <MdMonitor className="h-5 w-5" />
                            <p>share screen</p>
                        </DropdownMenuItem>

                        <DropdownMenuItem disabled={true}>
                            <MdCameraAlt className="h-5 w-5" />
                            <p>open camera</p>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>


            </div>
        </TooltipProvider>
    )
}

export default ActionPanel;
