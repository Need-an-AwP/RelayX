import { useEffect, useState } from "react";
import { usePopover, useTailscaleStore, useOnlinePeersStore } from "@/stores"
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";


export default function AppSettingPanel() {
    const { isAppSettingOpen } = usePopover()
    const { tailscaleStatus } = useTailscaleStore()
    const refreshTime = useOnlinePeersStore((state) => state.refreshTime);
    const [secondsAgo, setSecondsAgo] = useState<number | null>(null);


    useEffect(() => {
        if (refreshTime && refreshTime > 0) {
            const updateSecondsAgo = () => {
                const nowInSeconds = Math.floor(Date.now() / 1000);
                setSecondsAgo(nowInSeconds - refreshTime);
            };
            updateSecondsAgo();
            const intervalId = setInterval(updateSecondsAgo, 1000);
            return () => clearInterval(intervalId);
        } else {
            setSecondsAgo(null);
        }
    }, [refreshTime]);

    const renderDetail = (key: string, value: any) => {
        const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
            value !== null && value !== undefined ? String(value) : 'N/A';

        return (
            <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-border/50 gap-2">
                <span className="font-semibold text-muted-foreground whitespace-nowrap">{key}:</span>
                <span className="break-all min-w-0 text-right">{displayValue}</span>
            </div>
        );
    };

    return (
        <div
            className={cn(
                "fixed top-0 left-0 h-[calc(100vh-32px)] w-80 bg-background text-foreground border-r border-border ",
                "z-50 p-2 py-4 space-y-4",
                "transition-transform duration-300 ease-in-out translate-y-[32px]",
                isAppSettingOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <div className="flex text-left items-center mb-4">
                <h1 className="text-lg font-bold">App Settings</h1>
            </div>


            {/* peer refresh time */}
            <div className="flex flex-col gap-2">
                <h2 className="text-left text-md border-b pb-2">Peer Refresh Time</h2>
                <div className="flex justify-between items-center py-1 border-b border-border/50 gap-2 text-xs text-muted-foreground">
                    <span className="break-all min-w-0">{refreshTime && refreshTime > 0 ? new Date(refreshTime * 1000).toLocaleString() : '尚未更新'}</span>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {secondsAgo !== null ? `${secondsAgo}sec ago` : 'Not updated'}
                    </div>
                </div>
            </div>


            {/* Tailscale Status */}
            <div className="flex flex-col gap-2 h-1/2">
                <h2 className="text-left text-md border-b pb-2">Tailscale Status</h2>
                <ScrollArea className="flex flex-col gap-2 h-full text-muted-foreground">
                    {tailscaleStatus ? (
                        Object.entries(tailscaleStatus).map(([key, value]) => {
                            if (key === 'Peer' || key === 'User') return null; // Avoid rendering large objects
                            if (typeof value === 'object' && value !== null) {
                                return (
                                    <div key={key} className="flex flex-col gap-1 pl-2 border-l-2 border-primary/50">
                                        <h3 className="font-semibold text-sm">{key}</h3>
                                        <div className="pl-2">
                                            {Object.entries(value).map(([subKey, subValue]) => renderDetail(subKey, subValue))}
                                        </div>
                                    </div>
                                )
                            }
                            return renderDetail(key, value);
                        })
                    ) : (
                        <p>Loading Tailscale status...</p>
                    )}
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </div>
    )
}

