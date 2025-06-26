import { useOnlinePeersStore } from '@/stores/tailscaleStore'; // 确保路径正确
import { useState, useEffect } from 'react'; // 导入 useState 和 useEffect
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Laptop, Server, Smartphone, Globe, Clock, Wifi } from 'lucide-react'; // 图标库
import { Switch } from "@/components/ui/switch"; // 导入 Switch
import { Label } from "@/components/ui/label";   // 导入 Label
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePeerStateStore } from '@/stores/peerStateStore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// 辅助函数：根据操作系统名称获取图标
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
    const peers = useOnlinePeersStore((state) => state.peers);
    const characters = useOnlinePeersStore((state) => state.characters);

    const allPeerList = Object.values(peers);

    return (
        <>
            <div className="flex-1 overflow-auto p-2">
                {allPeerList.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            当前没有在线节点
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1 h-full">
                        {allPeerList.map((peer) => (
                            <div key={peer.ID || peer.HostName} className="border rounded-md p-2 text-xs hover:bg-muted/50">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="font-medium truncate" title={peer.HostName}>{peer.HostName}</div>
                                    <div className="flex items-center gap-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild><div>{getOsIcon(peer.OS)}</div></TooltipTrigger>
                                                <TooltipContent>{peer.OS || "未知系统"}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <Badge 
                                            className={`text-[10px] px-1 py-0 ${peer.Online ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
                                            variant={peer.Online ? "default" : "outline"}>
                                            {peer.Online ? "在线" : "离线"}
                                        </Badge>
                                        <Badge 
                                            variant={characters[peer.ID || peer.HostName] === "NONE" || !characters[peer.ID || peer.HostName] ? "outline" : "default"}
                                            className={`text-[10px] px-1 py-0 ${characters[peer.ID || peer.HostName] === "OFFER" ? "bg-blue-500 text-white" : characters[peer.ID || peer.HostName] === "ANSWER" ? "bg-purple-500 text-white" : ""}`}>
                                            {characters[peer.ID || peer.HostName] || "NONE"}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {peer.TailscaleIPs?.map((ip) => (
                                        <Badge variant="secondary" key={ip} className="text-[10px] px-1 py-0">{ip}</Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

const MembersView = () => {
    const peers = usePeerStateStore((state) => state.peers);
    const peerList = Array.from(peers.entries());

    if (peerList.length === 0) {
        return (
            <div className="p-2 h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">当前没有其他成员</p>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1 h-full space-y-2 mt-2">
            {peerList.map(([peerID, peer]) => (
                <div key={peerID} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 text-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={peer.userAvatar} alt={peer.userName} />
                            <AvatarFallback>{peer.userName.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate" title={peer.userName}>{peer.userName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {peer.latency > 0 ? (<><Wifi className="h-3 w-3" /><span>{peer.latency} ms</span></>) : (<span>-</span>)}
                    </div>
                </div>
            ))}
        </ScrollArea>
    );
}

export default function OnlinePeersDisplay() {
    const peers = useOnlinePeersStore((state) => state.peers);
    const refreshTime = useOnlinePeersStore((state) => state.refreshTime);
    const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
    const [showMembers, setShowMembers] = useState(true);

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

    if (refreshTime === 0 && Object.keys(peers).length === 0) {
        return (
            <div className="p-2 h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">正在等待节点数据...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-2 overflow-hidden">
            <div className="flex justify-between items-center mb-1 mx-2">
                <div className="flex items-center gap-2">
                    <Label htmlFor="view-switcher" className="text-xs">节点</Label>
                    <Switch
                        id="view-switcher"
                        checked={showMembers}
                        onCheckedChange={setShowMembers}
                        className="h-3 w-6"
                    />
                    <Label htmlFor="view-switcher" className="text-xs">成员</Label>
                </div>
                {!showMembers && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {secondsAgo !== null ? `${secondsAgo}秒前` : '未更新'}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {refreshTime && refreshTime > 0 ? new Date(refreshTime * 1000).toLocaleString() : '尚未更新'}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
                {showMembers ? <MembersView /> : <PeersView />}
            </div>
        </div>
    );
}
