import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePanelStore } from "./panelControls"
import { useCurrentUser, useScreenShare } from "@/stores"
import CardsDisplay from "./CardsDisplay";
import SourceSelector from "./ScreenShareView/SourceSelector";


export default function MidPanel() {
    const { isLeftPanelCollapsed, isRightPanelCollapsed, togglePanel } = usePanelStore()
    const isScreenSharing = useCurrentUser((state) => state.isScreenSharing)
    const requestSources = useScreenShare((state) => state.requestSources)
    const isSelectingSource = useScreenShare((state) => state.isSelectingSource)
    const setIsSelectingSource = useScreenShare((state) => state.setIsSelectingSource)
    const inVoiceChannel = useCurrentUser((state) => state.inVoiceChannel)

    useEffect(() => {
        const showScreenShareView = isScreenSharing || isSelectingSource
        if ((showScreenShareView && !isRightPanelCollapsed()) ||
            (!showScreenShareView && isRightPanelCollapsed())) {
            togglePanel('right')
        }
        if (isSelectingSource) {
            requestSources()
        }
    }, [isScreenSharing, isSelectingSource])

    return (
        <div className="relative h-full w-full flex justify-center items-center">
            {/* collapse buttons */}
            <div className="absolute left-0 top-0 z-50">
                <Button
                    size='icon'
                    variant="ghost"
                    onClick={() => togglePanel('left')}
                    className="hover:bg-white/10"
                    title={isLeftPanelCollapsed() ? "展开频道列表" : "收起频道列表"}
                >
                    {isLeftPanelCollapsed() ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>
            <div className="absolute right-0 top-0 z-50">
                <Button
                    size='icon'
                    variant="ghost"
                    onClick={() => togglePanel('right')}
                    className="hover:bg-white/10"
                    title={isRightPanelCollapsed() ? "展开用户列表" : "收起用户列表"}
                >
                    {isRightPanelCollapsed() ? (
                        <ChevronLeft className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {inVoiceChannel && <CardsDisplay />}

            <Drawer open={isSelectingSource} onOpenChange={setIsSelectingSource}>
                <DrawerContent className="h-2/3 overflow-hidden">
                    <div className="p-8 px-64 h-full">
                        <SourceSelector />
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
