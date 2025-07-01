import './App.css'
import { useEffect, useRef, useState } from 'react'
import OnlinePeersDisplay from '@/components/OnlinePeersDisplay'
import TailscaleStatusDisplay from '@/components/TailscaleStatusDisplay'
import { ThemeProvider } from '@/components/theme-provider'
import {
    initializeTailscaleListeners,
    initializeTURNListeners,
    initialAudioDevices,
    initializeAudioProcessing,
    usePopover
} from '@/stores'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import type { ImperativePanelHandle } from "react-resizable-panels"
import TitleBar from '@/components/TitleBar'
import UserPanel from '@/components/UserPanel'
import ChatPanel from '@/components/ChatPanel'
import MediaTrackManager from '@/MediaTrackManager'
import AudioPlaybackController from '@/mediaController/AudioPlaybackController'
import AppSettingPanel from '@/components/AppSettingPanel'
import StreamDisplay from '@/components/StreamDisplay'


function App() {
    const initialized = useRef(false)
    const rightSideBarRef = useRef<ImperativePanelHandle>(null);
    const leftSideBarRef = useRef<ImperativePanelHandle>(null);
    const isExtended = usePopover(state => state.isExtended)
    const {
        isNetworkPopoverOpen,
        isSettingPopoverOpen,
        isAppSettingOpen,
        isAudioCapturePopoverOpen,
        isUserPopoverOpen,
        closeAll
    } = usePopover()
    const isAnyPopoverOpen = isNetworkPopoverOpen || isSettingPopoverOpen || isAppSettingOpen || isAudioCapturePopoverOpen || isUserPopoverOpen

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        // receive tailscale status from electron main process
        initializeTailscaleListeners()
        // receive TURN info from electron main process
        initializeTURNListeners()
        // audio process
        initialAudioDevices()
        initializeAudioProcessing()
        // init media track manager
        MediaTrackManager.getInstance()
        // init audio playback controller
        AudioPlaybackController.getInstance()
        // reset window size
        window.ipcBridge.extendWindow('collapse')

        return () => { }
    }, [])

    useEffect(() => {
        if (isExtended) {
            leftSideBarRef.current?.resize(33)
        } else {
            leftSideBarRef.current?.resize(100)
        }
    }, [isExtended])

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="flex flex-col h-screen w-screen">
                <TitleBar />

                <div className="flex-grow h-full transition-all duration-300">
                    {/* Blur Overlay */}
                    <div
                        className={`
                            fixed inset-0 bg-black/10 backdrop-blur-sm z-40 transition-opacity duration-300
                            ${isAnyPopoverOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                        `}
                        onClick={() => closeAll()}
                    />

                    <TailscaleStatusDisplay />
                    <AppSettingPanel />

                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel
                            defaultSize={100}
                            minSize={10}
                            collapsible={true}
                            ref={leftSideBarRef}
                        >
                            <div className="flex flex-col h-full justify-start">
                                <ResizablePanelGroup direction="vertical">
                                    <ResizablePanel defaultSize={30} collapsible={true}>
                                        <OnlinePeersDisplay />
                                    </ResizablePanel>
                                    <ResizableHandle />
                                    <ResizablePanel>
                                        <ChatPanel />
                                    </ResizablePanel>
                                </ResizablePanelGroup>


                                <div className="pt-0 mt-auto">
                                    <UserPanel />
                                </div>
                            </div>
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel
                            defaultSize={0}
                            collapsible={true}
                            ref={rightSideBarRef}
                            className="h-[95vh]"
                        >
                            <StreamDisplay />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
                {/*         
            <RTCConnectionDisplay />

            <div>
                <button onClick={() => {
                                setIsExtended(!isExtended)
                                if (isExtended) {
                                    window.ipcBridge.extendWindow('collapse')
                                    leftSideBarRef.current?.resize(100)
                                }
                                else {
                                    window.ipcBridge.extendWindow('extend')
                                    leftSideBarRef.current?.resize(33)
                                }
                            }}>
                                {isExtended ? 'collapse' : 'extend'}
                            </button>
            </div> */}

            </div>
        </ThemeProvider>
    )
}

export default App
