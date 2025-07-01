import { usePopover, useTailscaleStore } from "@/stores"
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";


export default function AppSettingPanel() {
    const { isAppSettingOpen } = usePopover()
    const { tailscaleStatus } = useTailscaleStore()

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
                "fixed top-0 left-0 h-[calc(100vh-32px)] w-80 bg-background text-foreground border-r border-border z-50 p-2 py-4",
                "transition-transform duration-300 ease-in-out translate-y-[32px]",
                isAppSettingOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <div className="flex text-left items-center mb-4">
                <h1 className="text-lg font-bold">App Settings</h1>
            </div>

            <h2 className="text-left text-md border-b pb-2">Tailscale Status</h2>
            <ScrollArea className="flex flex-col gap-2 h-1/2">
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
    )
}

