import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTailscaleStore } from "@/stores";

export default function TailscaleStatus() {
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
        <div className="flex flex-col gap-2 h-[50vh]">
            <h2 className="text-left text-md border-b pb-2">Tailscale Status</h2>
            <ScrollArea className="flex flex-col gap-2 h-full text-muted-foreground px-2">
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