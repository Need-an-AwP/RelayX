import { useEffect, useState } from "react";
import { useDB, useTailscale } from "@/stores";
import { useChannel } from "@/stores"
import UsingPresetChannels from "./components/UsingPresetChannels";
import Loader from '@/components/ui/loader';
import { ScrollArea } from "@/components/ui/scroll-area"
import ChannelGroup from "./components/channelGroup";

export default function ChannelList({ toggleCollapse }: { toggleCollapse: (location: string, action: string) => void }) {
    const isPresetChannels = useChannel((state) => state.isPresetChannels);
    const fetchLoading = useChannel((state) => state.fetchLoding);

    return (
        <>
            {isPresetChannels && !fetchLoading && (
                <UsingPresetChannels />
            )}

            <ScrollArea className="px-2 overflow-x-hidden overscroll-x-none select-none relative h-full">
                {/* loading blur cover*/}
                {fetchLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 flex flex-col justify-center items-center">
                        <Loader size={40} />
                        <span className="text-sm text-muted-foreground">checking channels...</span>
                    </div>
                )}

                {/* text channel group*/}
                <ChannelGroup type="text" />

                {/* voice channel group*/}
                <ChannelGroup type="voice" />
                
            </ScrollArea>
        </>
    );
}