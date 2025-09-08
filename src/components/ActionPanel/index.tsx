import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, PhoneOff, Airplay, LoaderCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import { useLocalUserStateStore, useDesktopCapture } from "@/stores"
import { LuScreenShare, LuScreenShareOff } from "react-icons/lu";
import { useTailscaleStore } from "@/stores";
import SourceSelector from "./SourceSelector"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";



const ActionPanel = () => {
    const { tailscaleStatus } = useTailscaleStore()
    const { userState: selfState, updateSelfState } = useLocalUserStateStore()
    const { isSelectingSource, setIsSelectingSource, requestSources, stopScreenShare } = useDesktopCapture()
    const [isLoading, setIsLoading] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const handleStopScreenShare = () => {
        setIsDropdownOpen(false)
        stopScreenShare()
        updateSelfState({
            isSharingScreen: false
        })
    }

    const handleScreenShareClick = () => {
        if (selfState.isSharingScreen) {
            setIsDropdownOpen(true)
        } else {
            setIsSelectingSource(true)
            requestSources()
        }
    }


    return (
        <TooltipProvider>
            <div className={`grid items-center space-x-2 transition-[grid-template-columns] duration-300 ease-in-out 
                ${selfState.isInChat ?
                    selfState.isSharingScreen ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'
                    : 'grid-cols-[minmax(0,2fr)_minmax(0,0fr)]'}`}>
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
                            disabled={tailscaleStatus?.BackendState !== 'Running'}
                        >
                            {tailscaleStatus?.BackendState !== 'Running' ? <><LoaderCircle className="h-5 w-5 animate-spin" />Waiting for tailscale backend</> :
                                isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> :
                                    selfState.isInChat ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{selfState.isInChat ? 'leave chat' : 'join chat'}</p>
                    </TooltipContent>
                </Tooltip>





                <DropdownMenu
                    open={isDropdownOpen}
                    onOpenChange={(open) => {
                        if (selfState.isSharingScreen) {
                            setIsDropdownOpen(open)
                        }
                    }}
                >
                    <Dialog open={isSelectingSource} onOpenChange={(open) => !open && setIsSelectingSource(false)}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DialogTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            onClick={handleScreenShareClick}
                                            variant="outline"
                                            className={`hover:!bg-neutral-500 cursor-pointer 
                                            ${selfState.isSharingScreen ? '!bg-green-800 hover:!bg-red-600/60' : ''}
                                            ${selfState.isInChat ? '' : 'hidden'}
                                            transition-all duration-300`}
                                        >
                                            {selfState.isSharingScreen ? <LuScreenShareOff className="h-5 w-5" /> : <LuScreenShare className="h-5 w-5" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                </DialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                {selfState.isSharingScreen ? <p>stop screen sharing</p> : <p>start screen sharing</p>}
                            </TooltipContent>
                        </Tooltip>

                        <DialogContent 
                            onCloseAutoFocus={(e) => e.preventDefault()} 
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            showCloseButton={false} 
                            className="w-[80vw] !max-w-none"
                        >
                            <VisuallyHidden>
                                <DialogHeader>
                                    <DialogTitle>Select a screen to share</DialogTitle>
                                    <DialogDescription>
                                        a selector for selecting a video source, including screen, window, and camera
                                    </DialogDescription>
                                </DialogHeader>
                            </VisuallyHidden>
                            <SourceSelector />
                        </DialogContent>
                    </Dialog>
                    <DropdownMenuContent side="top" onCloseAutoFocus={(e) => e.preventDefault()}>
                        <DropdownMenuItem onClick={handleStopScreenShare}>
                            <LuScreenShareOff className="h-5 w-5" /> stop screen sharing
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={true}>
                            <LuScreenShare className="h-5 w-5" /> change screen sharing source
                        </DropdownMenuItem>
                    </DropdownMenuContent>

                </DropdownMenu>


            </div>
        </TooltipProvider >
    )
}

export default ActionPanel;
