
import { usePopover, useOnlinePeersStore } from "@/stores"
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import RefreshTime from "./RefreshTime";
import TailscaleStatusDisplay from "../TailscaleStatusDisplay";
import ConfigSettings from "./ConfigSettings";
import TailscaleSettings from "./TailscaleSettings";
import TailscaleStatus from "./TailscaleStatus";


export default function AppSettingPanel() {
    const { isAppSettingOpen } = usePopover()
    

    


    return (
        <div
            className={cn(
                "fixed top-0 left-0 h-[calc(100vh-32px)] w-[60vw] bg-background text-foreground border-r border-border ",
                "z-50 pt-4 pb-10",
                "transition-transform duration-300 ease-in-out translate-y-[32px]",
                isAppSettingOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <ScrollArea className='h-full px-4'>
                <div className='space-y-4'>
                    <div className="flex text-left items-center">
                        <h1 className="text-lg font-bold">App Settings</h1>
                    </div>

                    {/* tailscale settings */}
                    <TailscaleSettings />

                    {/* config settings */}
                    <ConfigSettings />


                    {/* peer refresh time */}
                    <RefreshTime />


                    {/* Tailscale Status */}
                    <TailscaleStatus />
                </div>
            </ScrollArea>


            {/* tailscale status fixed display */}
            <div className="absolute bottom-0 left-0 w-full bg-cyan-600">
                <TailscaleStatusDisplay autoCollapse={false} />
            </div>
        </div>
    )
}

