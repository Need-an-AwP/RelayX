import { useEffect, useRef, useState } from 'react'
import './App.css'
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
import OnlinePeersDisplay from '@/components/OnlinePeersDisplay'
import VoiceChatPanel from '@/components/VoiceChatPanel'
// import RightPanel from '@/components/RightPanel'
// import RTCConnectionDisplay from '@/components/RTCConnectionDisplay'
// import WelcomePanel from '@/components/WelcomePanel'
import { initInputTrackManager, initOutputTrackManager } from '@/MediaTrackManager'
import { initAudioContextManager } from '@/AudioManager'
import TsLoading from './components/TsLoading'


function App() {
    const initialized = useRef(false)
    const rightSideBarRef = useRef<ImperativePanelHandle>(null);
    const leftSideBarRef = useRef<ImperativePanelHandle>(null);
    const { activePopover, closeAll } = usePopover()
    const { setRef } = usePanelStore((state) => state)


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

        // init track managers
        initInputTrackManager()
        initOutputTrackManager()

        // init global audio context
        initAudioContextManager()

        setRef(leftSideBarRef, 30)
    }, [])

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="flex flex-col h-screen w-screen overflow-hidden">
                <TitleBar />
                {/* <WelcomePanel /> */}
                {/* presave 32px height for title bar */}
                <div className="flex-1 overflow-hidden mt-[32px]">
                    <div className="h-full w-full">
                        {/* Blur Overlay */}
                        <div
                            className={`fixed top-[32px] left-0 right-0 bottom-0 bg-black/10 backdrop-blur-sm z-40 
                                transition-opacity duration-300
                                ${activePopover ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                            onClick={() => {
                                if (activePopover === 'tsLoading') return;
                                closeAll()
                            }}
                        />

                        <TsLoading />

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
                                            <OnlinePeersDisplay />
                                        </ResizablePanel>
                                        <ResizableHandle />
                                        <ResizablePanel>
                                            <VoiceChatPanel />
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
