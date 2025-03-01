import { Tabs, TabsContent, TabsList, TabsTrigger, } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button";
import { X, Monitor, AppWindow, RotateCcw, Settings, OctagonX } from 'lucide-react';
import { useScreenShare, useCurrentUser } from '@/stores'

const SourceSelector = () => {
    const { availableSources: sources, requestSources, stream, setStream, setIsSelectingSource } = useScreenShare((state) => state)
    const { setIsScreenSharing } = useCurrentUser((state) => state)


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
            setIsScreenSharing(true);
            // set sync status
        } catch (error) {
            console.error('capture error:', error);
        }
    }

    const tabsContentClass = `w-full h-full mb-14 overflow-y-auto overflow-x-hidden 
    [&::-webkit-scrollbar]:w-2 pl-2 [&::-webkit-scrollbar-track]:bg-transparent
    [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#101720]
    hover:[&::-webkit-scrollbar-thumb]:bg-[#212A37]`

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
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
            <Tabs defaultValue="screen" className="flex-1 flex flex-col h-full">
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
                    <div className="flex flex-row flex-wrap gap-4 items-center justify-center">
                        {sources
                            .filter(source => source.id.startsWith('screen'))
                            .map((source) => (
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
                            ))}
                    </div>
                </TabsContent>
                {/* window source */}
                <TabsContent value="window" className={tabsContentClass}>
                    <div className={`flex flex-row flex-wrap gap-4 items-center justify-center`}>
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
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SourceSelector;