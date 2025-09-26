import { ScrollArea } from "@/components/ui/scroll-area";
// import RefreshTime from "./RefreshTime";
// import TailscaleStatusDisplay from "../TailscaleStatusDisplay";
import ConfigSettings from "./ConfigSettings";
import TailscaleSettings from "./TailscaleSettings";
// import TailscaleStatus from "./TailscaleStatus";

export default function AppSettingPanel({ className }: { className?: string }) {
    return (
        <div className={`relative pb-6 ${className}`}>
            <ScrollArea className='h-full px-4'>
                <div className='space-y-4'>
                    {/* tailscale settings */}
                    <TailscaleSettings />

                    {/* config settings */}
                    <ConfigSettings />

                    {/* peer refresh time */}
                    {/* <RefreshTime /> */}

                    {/* Tailscale Status */}
                    {/* <TailscaleStatus /> */}
                </div>
            </ScrollArea>


            {/* tailscale status fixed display */}
            <div className="absolute bottom-0 left-0 w-full bg-teal-600/90">
                {/* <TailscaleStatusDisplay autoCollapse={false} /> */}
            </div>
        </div>
    )
}

