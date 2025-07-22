import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Laptop, Server, Smartphone, Globe, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePeerStateStore, useOnlinePeersStore } from '@/stores';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"



const getOsIcon = (os?: string) => {
    if (!os) return <Laptop className="h-4 w-4 text-muted-foreground" />;
    const lowerOs = os.toLowerCase();
    if (lowerOs.includes('windows')) return <Laptop className="h-4 w-4 text-blue-500" />;
    if (lowerOs.includes('linux')) return <Server className="h-4 w-4 text-orange-500" />;
    if (lowerOs.includes('darwin') || lowerOs.includes('macos')) return <Laptop className="h-4 w-4 text-gray-500" />;
    if (lowerOs.includes('android')) return <Smartphone className="h-4 w-4 text-green-500" />;
    if (lowerOs.includes('ios')) return <Smartphone className="h-4 w-4 text-purple-500" />;
    return <Globe className="h-4 w-4 text-muted-foreground" />; // 默认图标
};

const PeersView = () => {
    const users = usePeerStateStore((state) => state.peers);
    const peers = useOnlinePeersStore((state) => state.peers);
    const characters = useOnlinePeersStore((state) => state.characters);

    const allPeerList = Object.values(peers);

    return (
        <>
            <div className="@container flex-1 overflow-auto">
                {allPeerList.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            No online peers or users
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-full w-full">
                        {allPeerList.map((peer) => {
                            const user = users[peer.TailscaleIPs[0]];

                            return (
                                <Dialog key={peer.ID}>
                                    <DialogTrigger asChild>
                                        <div className="border rounded-md space-y-2 p-2 mb-2 mx-2 text-xs hover:bg-muted/50 cursor-pointer">
                                            {user && (<>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={user.userAvatar} alt={user.userName} draggable={false} />
                                                            <AvatarFallback>{user.userName.slice(0, 2)}</AvatarFallback>
                                                        </Avatar>
                                                        <span
                                                            className="font-medium text-start w-[50cqw] line-clamp-2"
                                                            title={user.userName}
                                                        >
                                                            {user.userName}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        {user.latency > 0 ? (<><Wifi className="h-3 w-3" /><span>{user.latency} ms</span></>) : (<span>-</span>)}
                                                    </div>
                                                </div>
                                                <Separator />
                                            </>)}

                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-medium text-muted-foreground truncate" title="HostName">{peer.HostName}</div>
                                                <div className="flex items-center gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild><div>{getOsIcon(peer.OS)}</div></TooltipTrigger>
                                                            <TooltipContent side='left'>{peer.OS || "未知系统"}</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <Badge
                                                        className={`text-[10px] px-1 py-0 cursor-default ${peer.Online ? "bg-green-500 text-white" : ""}`}
                                                        variant={peer.Online ? "default" : "outline"}>
                                                        {peer.Online ? "Online" : "Offline"}
                                                    </Badge>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Badge
                                                                    variant={characters[peer.ID || peer.HostName] === "NONE" || !characters[peer.ID || peer.HostName] ? "outline" : "default"}
                                                                    className={`text-[10px] px-1 py-0 cursor-default ${characters[peer.ID || peer.HostName] === "OFFER" ? "bg-blue-500 text-white" : characters[peer.ID || peer.HostName] === "ANSWER" ? "bg-purple-500 text-white" : ""}`}>
                                                                    {characters[peer.ID || peer.HostName] || "NONE"}
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent side='bottom'>character in rtc connection</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="@container">
                                        <DialogHeader>
                                            <DialogTitle>{peer.TailscaleIPs[0]}</DialogTitle>
                                            <DialogDescription className="flex flex-row gap-2">
                                                {peer.HostName}
                                                {peer.TailscaleIPs?.map((ip) => (
                                                    <Badge variant="secondary" key={ip} className="text-[10px] px-1 py-0">{ip}</Badge>
                                                ))}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex flex-col gap-2">
                                            {user && (<div className='max-w-[100cqw] overflow-hidden'>
                                                <pre className="text-sm text-green-500 whitespace-pre-wrap">
                                                    {JSON.stringify(user, null, 2)}
                                                </pre>
                                            </div>)}
                                            <div className="h-[30vh] w-[100cqw] bg-muted rounded-md p-1">
                                                <ScrollArea className="h-full w-full">
                                                    <pre className="text-sm">
                                                        {JSON.stringify(peer, null, 2)}
                                                    </pre>
                                                    <ScrollBar orientation="horizontal" />
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                            )
                        })}
                    </ScrollArea>
                )}
            </div>
        </>
    );
};


export default function OnlinePeersDisplay() {
    const peers = useOnlinePeersStore((state) => state.peers);
    const refreshTime = useOnlinePeersStore((state) => state.refreshTime);

    if (refreshTime === 0 && Object.keys(peers).length === 0) {
        return (
            <div className="p-2 h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Waiting for peers info...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col py-2 overflow-hidden">

            <div className="flex-1 overflow-hidden flex flex-col">
                <PeersView />
            </div>
        </div>
    );
}
