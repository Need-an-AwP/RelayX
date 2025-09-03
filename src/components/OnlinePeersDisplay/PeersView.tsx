import { usePeerStateStore, usePeerLatencyStore, useOnlinePeersStore } from '@/stores';
import { useEffect, useRef, memo, useMemo } from 'react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge";
import { Laptop, Server, Smartphone, Globe, Wifi } from 'lucide-react';


const OsIcon = memo(({ os }: { os?: string }) => {
    if (!os) return <Laptop className="h-4 w-4 text-muted-foreground" />;
    const lowerOs = os.toLowerCase();
    if (lowerOs.includes('windows')) return <Laptop className="h-4 w-4 text-blue-500" />;
    if (lowerOs.includes('linux')) return <Server className="h-4 w-4 text-orange-500" />;
    if (lowerOs.includes('darwin') || lowerOs.includes('macos')) return <Laptop className="h-4 w-4 text-gray-500" />;
    if (lowerOs.includes('android')) return <Smartphone className="h-4 w-4 text-green-500" />;
    if (lowerOs.includes('ios')) return <Smartphone className="h-4 w-4 text-purple-500" />;
    return <Globe className="h-4 w-4 text-muted-foreground" />; // 默认图标
});

const LatencyDisplay = memo(({ peerIP }: { peerIP: string }) => {
    const latencyRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const unsubscribe = usePeerLatencyStore.subscribe(
            (state) => state.latencies[peerIP]?.latency,
            (latency) => {
                if (latencyRef.current) {
                    latencyRef.current.textContent = (latency && latency > 0) ? `${latency} ms` : '-';
                }
            },
            { equalityFn: (a, b) => a === b }
        );

        // 初始化显示
        const initialLatency = usePeerLatencyStore.getState().latencies[peerIP]?.latency;
        if (latencyRef.current) {
            latencyRef.current.textContent = (initialLatency && initialLatency > 0) ? `${initialLatency} ms` : '-';
        }

        return unsubscribe;
    }, [peerIP]);

    return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wifi className="h-3 w-3" />
            <span ref={latencyRef}>-</span>
        </div>
    );
});

const PeerItem = memo(({ peer, user, characterStatus }: {
    peer: any;
    user?: any;
    characterStatus?: string;
}) => {
    const peerIP = peer.TailscaleIPs[0];
    
    // memo化样式计算
    const onlineStyle = useMemo(() => 
        `text-[10px] px-1 py-0 cursor-default ${peer.Online ? "bg-green-500 text-white" : ""}`,
        [peer.Online]
    );
    
    const characterStyle = useMemo(() => 
        `text-[10px] px-1 py-0 cursor-default ${characterStatus === "OFFER" ? "bg-blue-500 text-white" : characterStatus === "ANSWER" ? "bg-purple-500 text-white" : ""}`,
        [characterStatus]
    );

    const characterVariant = useMemo(() => 
        characterStatus === "NONE" || !characterStatus ? "outline" : "default",
        [characterStatus]
    );

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

                            <LatencyDisplay peerIP={peerIP} />

                        </div>
                        <Separator />
                    </>)}

                    <div className="flex justify-between items-center mb-1">
                        <div className="font-medium text-muted-foreground truncate" title="HostName">{peer.HostName}</div>
                        <div className="flex items-center gap-1">
                            <div title={peer.OS}><OsIcon os={peer.OS} /></div>
                            <Badge
                                className={onlineStyle}
                                variant={peer.Online ? "default" : "outline"}>
                                {peer.Online ? "Online" : "Offline"}
                            </Badge>
                            <Badge
                                title="character in rtc connection"
                                variant={characterVariant}
                                className={characterStyle}>
                                {characterStatus || "NONE"}
                            </Badge>

                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="@container">
                <DialogHeader>
                    <DialogTitle>{peer.TailscaleIPs[0]}</DialogTitle>
                    <DialogDescription className="flex flex-row gap-2">
                        {peer.HostName}
                        {peer.TailscaleIPs?.map((ip: string) => (
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
    );
});

const PeersView = () => {
    const { peers: users } = usePeerStateStore();
    const peers = useOnlinePeersStore((state) => state.peers);
    const characters = useOnlinePeersStore((state) => state.characters);

    const allPeerList = useMemo(() => Object.values(peers), [peers]);

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
                            const peerIP = peer.TailscaleIPs[0];
                            const user = users[peerIP];
                            const characterStatus = characters[peer.ID || peer.HostName];

                            return (
                                <PeerItem 
                                    key={peer.ID}
                                    peer={peer}
                                    user={user}
                                    characterStatus={characterStatus}
                                />
                            );
                        })}
                    </ScrollArea>
                )}
            </div>
        </>
    );
};

export default PeersView;