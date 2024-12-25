import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Info, Turtle, UserRound } from "lucide-react"

import { useTailscale } from '@/stores'
import { usePopover } from "@/stores/popoverStore"
import NetworkSelector from "./NetworkSelector"
import JoinDialog from "./JoinDialog"
import InviteDialog from "./InviteDialog"
import CreateDialog from "./CreateDialog"

const NetworkPopover = () => {
    const status = useTailscale(state => state.status);
    const isTailscaleAuthKey = useTailscale(state => state.isTailscaleAuthKey);
    const isNetworkPopoverOpen = usePopover(state => state.isNetworkPopoverOpen);
    const toggle = usePopover(state => state.toggle);

    if (!status) return null;

    return (
        <Popover open={isNetworkPopoverOpen} onOpenChange={() => toggle('isNetworkPopoverOpen')}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={`
                        w-full py-8 h-[50px] border-0 rounded-[0px] bg-opacity-90 bg-[#2d2d2d]
                        ${isNetworkPopoverOpen ? 'z-50' : null}
                        hover:bg-opacity-100
                        ${isTailscaleAuthKey ? 'hover:bg-rose-300 ' : 'hover:bg-sky-300'}
                        `}
                >
                    <div className="flex flex-col text-start w-full mx-4">
                        <strong>Current Network: </strong>
                        {status && (
                            <p>{status.User[status.Self.UserID].LoginName}</p>
                        )}
                    </div>
                </Button>
            </PopoverTrigger>

            <PopoverContent side="left" className="w-80 m-8 ml-0 z-50 overflow-hidden" >
                <div className="space-y-2">

                    <NetworkSelector />

                    <div className="flex gap-2">
                        <JoinDialog />
                        <InviteDialog />
                    </div>

                    <CreateDialog />

                    <div className="flex items-center justify-center gap-2 text-xs">
                        <Info size={16} />
                        {isTailscaleAuthKey ?
                            <p>You are using <strong>Tailscale</strong> offical controller</p>
                            :
                            <p>You are using <strong>Headscale</strong> private controller</p>
                        }
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
export default NetworkPopover;