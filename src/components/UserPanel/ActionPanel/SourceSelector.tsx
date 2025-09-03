import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button";
import { X, Monitor, AppWindow, RotateCcw, Settings, OctagonX } from 'lucide-react';
import { useLocalUserStateStore, useDesktopCapture } from '@/stores'

export default function SourceSelector() {
    const {
        captureSources: sources,
        requestSources,
        stream,
        setStream,
        setIsSelectingSource
    } = useDesktopCapture((state) => state)
    const updateSelfState = useLocalUserStateStore(state => state.updateSelfState)
    const [selectedCategory, setSelectedCategory] = useState<string>('screen')


    const startCapture = async (sourceId: string) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            // set source id first then use getdisplaymedia method
            window.ipcBridge.setScreenCaptureId(sourceId);

            const captureStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: 60,//120,
                },
                audio: false,
            })
            console.log('captureStream:', captureStream);
            setStream(captureStream);
            setIsSelectingSource(false);
            updateSelfState({
                isSharingScreen: true,
            });
            // set sync status
        } catch (error) {
            console.error('capture error:', error);
        }
    }

    const cancelCapture = () => {
        setIsSelectingSource(false);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        updateSelfState({
            isSharingScreen: false,
        });
    }

    const tabsTriggerClass = `flex items-center gap-2 px-10 cursor-pointer`

    return (
        <div className="flex-1 flex-col select-none">
            {/* title */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Select Share Source</h3>
                <div className="space-x-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={requestSources} className="cursor-pointer">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>refresh capture sources</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={cancelCapture} className="cursor-pointer">
                                    <X className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>cancel</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* sources selector */}
            <Tabs
                defaultValue="screen"
                className="flex flex-col items-center"
                onValueChange={(e) => {
                    setSelectedCategory(e)
                }}
            >
                <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="screen" className={tabsTriggerClass}>
                        <Monitor className="h-4 w-4" />
                        Screen
                    </TabsTrigger>
                    <TabsTrigger value="window" className={tabsTriggerClass}>
                        <AppWindow className="h-4 w-4" />
                        Window
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className='h-[60vh]'>
                <ScrollArea className="h-full">
                    <div className="flex flex-row flex-wrap gap-4 items-center justify-center p-4">
                        {sources
                            .filter(source => source.id.startsWith(selectedCategory))
                            .map((source) => {
                                return (
                                    <div
                                        key={source.id}
                                        onClick={() => startCapture(source.id)}
                                        className="group cursor-pointer border rounded-lg p-2 hover:bg-accent transition-colors
                                            w-60 xl:w-80"
                                    >
                                        <div className="mb-2 overflow-hidden rounded-md">
                                            <img
                                                src={source.thumbnail}
                                                alt={source.name}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="grid grid-cols-[auto_1fr] items-center gap-2 px-1 max-w-full min-w-0">
                                            {selectedCategory === 'screen' ?
                                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                                :
                                                <>
                                                    {source.appIcon ? (
                                                        <img
                                                            src={source.appIcon}
                                                            alt="app icon"
                                                            className="h-4 w-4"
                                                        />
                                                    ) : (
                                                        <AppWindow className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </>}
                                            <span className="text-sm text-left truncate">{source.name}</span>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};
