import { useState, useRef, useEffect } from 'react'
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

import { usePopover } from "@/stores/popoverStore"
import RightSideBar from '@/components/RightSideBar'
import NetworkPopover from '@/components/NetworkPopover'
import ChannelList from '@/components/ChannelList'
import UserPanel from '@/components/UserPanel'
import MidPanel from '@/components/MidPanel'
import { useMirror } from "@/stores/mirrorStates"
import { useChannel, useRemoteUserStore, useCurrentUser } from "@/stores"
import { usePanelStore } from "@/components/MidPanel/panelControls"


export default function MainLayout() {
    const { isLeftPanelCollapsed, isRightPanelCollapsed } = usePanelStore()
    const rightSideBarRef = useRef<ImperativePanelHandle>(null);
    const leftSideBarRef = useRef<ImperativePanelHandle>(null);
    // init panels control
    const defaultLSize = 20
    const defaultRSize = 25
    useEffect(() => {
        usePanelStore.getState().setRefs(leftSideBarRef, rightSideBarRef, defaultLSize, defaultRSize)
    }, [])

    // for debugging
    const user = useMirror((state) => state.user)
    const isPresetChannels = useMirror((state) => state.isPresetChannels)
    const inVoiceChannel = useMirror((state) => state.inVoiceChannel)
    const isScreenSharing = useMirror((state) => state.isScreenSharing)
    const isMuted = useMirror((state) => state.isMuted)
    const isDeafened = useMirror((state) => state.isDeafened)
    const customStatus = useMirror((state) => state.customStatus)
    const channelStore_channels = useChannel((state) => state.channels)
    const channelStore_users = useChannel((state) => state.users)
    const remoteUsers = useRemoteUserStore((state) => state.remoteUsersInfo)
    const currentUser_inVoiceChannel = useCurrentUser((state) => state.inVoiceChannel)

    const {
        isNetworkPopoverOpen,
        isSettingPopoverOpen,
        isChannelPopoverOpen,
        isAudioCapturePopoverOpen,
        isUserPopoverOpen,
        closeAll
    } = usePopover()
    const isAnyPopoverOpen = isNetworkPopoverOpen || isSettingPopoverOpen || isChannelPopoverOpen || isAudioCapturePopoverOpen || isUserPopoverOpen

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="flex flex-col h-screen w-screen">
                <TitleBar />
                <BackgroundBeams className='pointer-events-none' />


                <div className="flex-grow h-[calc(100vh-32px)]">
                    {/* Blur Overlay */}
                    {isAnyPopoverOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
                            onClick={() => closeAll()}
                        />
                    )}

                    <ResizablePanelGroup direction="horizontal">
                        {/* Left Sidebar - Channels and Controls */}
                        <ResizablePanel
                            defaultSize={defaultLSize}
                            collapsible={true}
                            ref={leftSideBarRef}
                        >
                            <div className="flex flex-col h-full justify-start">
                                <NetworkPopover />

                                <Separator className="w-full" />

                                <ChannelList />

                                <div className="pt-0 mt-auto bg-[#2d2d2d]">
                                    <UserPanel />
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle
                            className={`w-[2px] ${isLeftPanelCollapsed() ? 'hidden' : ''}`}
                            withHandle={true}
                            showGripIcon={false}
                        />

                        {/* Main Content Area */}
                        <ResizablePanel className='z-10'>
                            <MidPanel />
                            {/* <div className="bg-red-500 h-full w-1/2">
                                <pre>
                                    {JSON.stringify(inVoiceChannel, null, 2)}
                                    {JSON.stringify(currentUser_inVoiceChannel, null, 2)}
                                    {JSON.stringify(channelStore_users, null, 2)}
                                </pre>
                            </div> */}
                        </ResizablePanel>

                        <ResizableHandle
                            className={`w-[2px] ${isRightPanelCollapsed() ? 'hidden' : ''}`}
                            withHandle={true}
                            showGripIcon={false}
                        />

                        {/* Right Sidebar - System Info */}
                        <ResizablePanel
                            defaultSize={defaultRSize}
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