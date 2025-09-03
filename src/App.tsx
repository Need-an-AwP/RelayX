import { useEffect, useRef, useState } from 'react'
import {
    initializeTwgListeners,
    initialAudioDevices,
    initializeAudioProcessing,
    initializeWsListener,
    usePopover,
    usePanelStore
} from '@/stores'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import type { ImperativePanelHandle } from "react-resizable-panels"
import { ThemeProvider } from '@/components/theme-provider'
import TitleBar from '@/components/TitleBar'
import UserPanel from '@/components/UserPanel'
import './App.css'

function App() {
    const initialized = useRef(false)
    const rightSideBarRef = useRef<ImperativePanelHandle>(null);
    const leftSideBarRef = useRef<ImperativePanelHandle>(null);
    const {
        isNetworkPopoverOpen,
        isSettingPopoverOpen,
        isAppSettingOpen,
        isAudioCapturePopoverOpen,
        isUserPopoverOpen,
        closeAll
    } = usePopover()
    const { setRef } = usePanelStore((state) => state)
    const isAnyPopoverOpen = isNetworkPopoverOpen || isSettingPopoverOpen || isAppSettingOpen || isAudioCapturePopoverOpen || isUserPopoverOpen


    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // init twg
        initializeTwgListeners();

        // init ws
        initializeWsListener();

        // audio process
        initialAudioDevices()
        initializeAudioProcessing()

        setRef(leftSideBarRef, 30)
    }, [])

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="flex flex-col h-screen w-screen overflow-hidden">
                <TitleBar />
                {/* <WelcomePanel /> */}
                {/* 为标题栏预留32px高度 */}
                <div className="flex-1 overflow-hidden mt-[32px]">
                    <div className="h-full w-full">
                        {/* Blur Overlay */}
                        <div
                            className={`
                                fixed top-[32px] left-0 right-0 bottom-0 bg-black/10 backdrop-blur-sm z-40 transition-opacity duration-300
                                ${isAnyPopoverOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                            `}
                            onClick={() => closeAll()}
                        />

                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel
                                defaultSize={30}
                                maxSize={80}
                                minSize={20}
                                collapsible={true}
                                ref={leftSideBarRef}
                            >
                                <div className="flex flex-col h-full justify-start">
                                    <ResizablePanelGroup direction="vertical">
                                        <ResizablePanel defaultSize={30} collapsible={true}>
                                            {/* <OnlinePeersDisplay /> */}
                                        </ResizablePanel>
                                        <ResizableHandle />
                                        <ResizablePanel>
                                            {/* <VoiceChatPanel /> */}
                                        </ResizablePanel>
                                    </ResizablePanelGroup>


                                    <div className="pt-0 mt-auto">
                                        <UserPanel />
                                    </div>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel
                                collapsible={true}
                                ref={rightSideBarRef}
                                className="h-full"
                            >
                                {/* <RightPanel /> */}
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
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
