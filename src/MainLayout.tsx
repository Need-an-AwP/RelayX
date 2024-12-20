import { useState, useRef } from 'react'

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import TitleBar from '@/components/TitleBar'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { ThemeProvider } from "@/components/theme-provider"
import type { ImperativePanelHandle } from "react-resizable-panels"

import RightSideBar from '@/components/RightSideBar/RightSideBar'


export default function MainLayout() {
    const rightSideBarRef = useRef<ImperativePanelHandle>(null);
    const leftSideBarRef = useRef<ImperativePanelHandle>(null);
    const toggleCollapse = (location: string, action: string) => {
        if (location === 'right' && rightSideBarRef.current) {
            const isCollapsed = rightSideBarRef.current.isCollapsed();
            if (action === 'expand' && isCollapsed) {
                rightSideBarRef.current.expand();
            } else if (action === 'collapse' && !isCollapsed) {
                rightSideBarRef.current.collapse();
            }
        } else if (location === 'left' && leftSideBarRef.current) {
            const isCollapsed = leftSideBarRef.current.isCollapsed();
            if (action === 'expand' && isCollapsed) {
                leftSideBarRef.current.expand();
            } else if (action === 'collapse' && !isCollapsed) {
                leftSideBarRef.current.collapse();
            }
        }
    }


    const [isNetworkPopoverOpen, setIsNetworkPopoverOpen] = useState(false)
    const [isSettingPopoverOpen, setIsSettingPopoverOpen] = useState(false)
    const [isChannelPopoverOpen, setIsChannelPopoverOpen] = useState(false)
    const [isAudioCapturePopoverOpen, setIsAudioCapturePopoverOpen] = useState(false)
    const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);


    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="flex flex-col h-screen w-screen">
                <TitleBar />
                <BackgroundBeams className='pointer-events-none' />


                <div className="flex-grow h-[calc(100vh-32px)]">
                    {/* Overlay */}
                    {(isNetworkPopoverOpen || isSettingPopoverOpen || isChannelPopoverOpen || isAudioCapturePopoverOpen || isUserPopoverOpen) && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
                            onClick={() => {
                                setIsNetworkPopoverOpen(false)
                                setIsSettingPopoverOpen(false)
                                setIsChannelPopoverOpen(false)
                                setIsAudioCapturePopoverOpen(false)
                                setIsUserPopoverOpen(false)
                            }}
                        />
                    )}

                    <ResizablePanelGroup direction="horizontal">
                        {/* Left Sidebar - Channels and Controls */}
                        <ResizablePanel
                            defaultSize={20}
                            collapsible={true}
                            ref={leftSideBarRef}
                        >
                            <div className="flex flex-col h-full justify-start">
                                {/* <NetworkPopover
                                    isNetworkPopoverOpen={isNetworkPopoverOpen}
                                    setIsNetworkPopoverOpen={setIsNetworkPopoverOpen}
                                /> */}

                                <Separator className="w-full" />

                                {/* <ChannelList toggleCollapse={toggleCollapse} /> */}

                                <div className="pt-0 mt-auto bg-[#2d2d2d]">
                                    {/* <UserPanel
                                        isSettingPopoverOpen={isSettingPopoverOpen}
                                        setIsSettingPopoverOpen={setIsSettingPopoverOpen}
                                        isAudioCapturePopoverOpen={isAudioCapturePopoverOpen}
                                        setIsAudioCapturePopoverOpen={setIsAudioCapturePopoverOpen}
                                        toggleCollapse={toggleCollapse}
                                    /> */}
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle className="w-[2px]" withHandle={true} showGripIcon={false} />

                        {/* Main Content Area */}
                        <ResizablePanel className='z-10'>
                            {/* <MidPanel toggleCollapse={toggleCollapse}/> */}
                        </ResizablePanel>

                        <ResizableHandle className="w-[2px]" withHandle={true} showGripIcon={false} />

                        {/* Right Sidebar - System Info */}
                        <ResizablePanel
                            defaultSize={25}
                            collapsible={true}
                            ref={rightSideBarRef}
                        >
                            <RightSideBar />
                        </ResizablePanel>


                    </ResizablePanelGroup>
                </div>
            </div>
        </ThemeProvider>
    )
}