import { Tabs, TabsContent, TabsList, TabsTrigger, } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button";
import { X, Monitor, AppWindow, RotateCcw, Settings, OctagonX } from 'lucide-react';
import { usePeerStateStore, useDesktopCapture } from '@/stores'

export default function SourceSelector() {
    const {
        captureSources: sources,
        requestSources,
        stream,
        setStream,
        setIsSelectingSource
    } = useDesktopCapture((state) => state)
    const updateSelfState = usePeerStateStore(state => state.updateSelfState)


    const startCapture = async (sourceId: string) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            // set source id first then use getdisplaymedia method
            window.ipcBridge.send('capture_id', sourceId);

            const captureStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: 120,
                },
                audio: true,
            })

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

    const tabsContentClass = `w-full h-full overflow-hidden`

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Select Share Source</h3>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={requestSources}>
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>refresh capture sources</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {/* sources selector */}
            <Tabs defaultValue="screen" className="flex-1 flex flex-col h-[90%]">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="screen" className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Screen
                    </TabsTrigger>
                    <TabsTrigger value="window" className="flex items-center gap-2">
                        <AppWindow className="h-4 w-4" />
                        Window
                    </TabsTrigger>
                </TabsList>
                {/* screen source */}
                <TabsContent value="screen" className={tabsContentClass}>
                    <ScrollArea className="h-full">
                        <div className="flex flex-row flex-wrap gap-4 items-center justify-center p-4">
                            {sources
                                .filter(source => source.id.startsWith('screen'))
                                .map((source) => {
                                    return Array.from({ length: 10 }).map((_, index) => (
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
                                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-left truncate">{source.name}</span>
                                            </div>
                                        </div>
                                    ))
                                })}
                        </div>
                    </ScrollArea>
                </TabsContent>
                {/* window source */}
                <TabsContent value="window" className={tabsContentClass}>
                    <ScrollArea className="h-full">
                        <div className="flex flex-row flex-wrap gap-4 items-center justify-center p-4">
                            {sources
                                .filter(source => source.id.startsWith('window'))
                                .map((source) => (
                                    <div
                                        key={source.id}
                                        onClick={() => startCapture(source.id)}
                                        className="
                                        group cursor-pointer border rounded-lg p-2 hover:bg-accent transition-colors
                                        object-contain w-60 xl:w-80
                                        "
                                    >
                                        <div className="mb-2 overflow-hidden rounded-md flex items-center justify-center">
                                            <img
                                                src={source.thumbnail}
                                                alt={source.name}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="grid grid-cols-[auto_1fr] items-center gap-2 px-1 max-w-full min-w-0">
                                            {source.appIcon ? (
                                                <img
                                                    src={source.appIcon}
                                                    alt="app icon"
                                                    className="h-4 w-4"
                                                />
                                            ) : (
                                                <AppWindow className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className="text-sm text-left truncate">{source.name}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
};
