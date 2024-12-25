import { ScrollArea } from "@/components/ui/scroll-area"
import { useTailscale } from "@/stores/internals/tailscaleStore"
import OnlineUsers from "./OnlineUsers" 

export default function RightSideBar() {
    const { status } = useTailscale()
    return (
        <ScrollArea className="h-full p-4">
            <div className="w-full space-y-4">

                <OnlineUsers />

                <ScrollArea className="rounded-md border bg-white bg-opacity-5 max-h-[500px]">
                    {status && (
                        <div className="space-y-4 h-full">
                            {Object.entries(status.Peer).map(([key, peer]) => (
                                <div key={key} className="peer-card text-sm flex flex-col gap-2">
                                    <strong>{peer.HostName}</strong>
                                    <div className="flex justify-center">
                                        OS:{peer.OS} UserID:{peer.UserID}<br />
                                        IPs: {peer.TailscaleIPs.join(', ')}<br />
                                        Online: {peer.Online ? '🟢' : '⚪'}<br />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </ScrollArea>
    )
}