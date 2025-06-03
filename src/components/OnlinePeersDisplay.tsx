import { useOnlinePeersStore } from '@/stores/tailscaleStore'; // 确保路径正确
import { useState, useEffect } from 'react'; // 导入 useState 和 useEffect
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Laptop, Server, Smartphone, Globe } from 'lucide-react'; // 图标库
import { Switch } from "@/components/ui/switch"; // 导入 Switch
import { Label } from "@/components/ui/label";   // 导入 Label

// 辅助函数：根据操作系统名称获取图标
const getOsIcon = (os?: string) => {
    if (!os) return <Laptop className="h-5 w-5 text-muted-foreground" />;
    const lowerOs = os.toLowerCase();
    if (lowerOs.includes('windows')) return <Laptop className="h-5 w-5 text-blue-500" />;
    if (lowerOs.includes('linux')) return <Server className="h-5 w-5 text-orange-500" />;
    if (lowerOs.includes('darwin') || lowerOs.includes('macos')) return <Laptop className="h-5 w-5 text-gray-500" />;
    if (lowerOs.includes('android')) return <Smartphone className="h-5 w-5 text-green-500" />;
    if (lowerOs.includes('ios')) return <Smartphone className="h-5 w-5 text-purple-500" />;
    return <Globe className="h-5 w-5 text-muted-foreground" />; // 默认图标
};

export default function OnlinePeersDisplay() {
    const peers = useOnlinePeersStore((state) => state.peers);
    const characters = useOnlinePeersStore((state) => state.characters);
    const refreshTime = useOnlinePeersStore((state) => state.refreshTime); // Unix timestamp in seconds
    const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
    const [showOnlyReachable, setShowOnlyReachable] = useState(true); // 开关状态，默认开启

    // PeerStatus 对象数组，键是 peer ID
    const allPeerList = Object.values(peers);
    const filteredPeerList = allPeerList.filter(peer => {
        if (!showOnlyReachable) return true; // 如果不只显示可达的，则显示所有
        const characterState = characters[peer.ID || peer.HostName]; // 假设 peer 对象有 ID 字段，否则用 HostName
        return characterState === "OFFER" || characterState === "ANSWER";
    });

    useEffect(() => {
        if (refreshTime && refreshTime > 0) {
            const updateSecondsAgo = () => {
                const nowInSeconds = Math.floor(Date.now() / 1000);
                setSecondsAgo(nowInSeconds - refreshTime);
            };

            updateSecondsAgo(); // Initial calculation
            const intervalId = setInterval(updateSecondsAgo, 1000); // Update every second

            return () => clearInterval(intervalId); // Cleanup interval on component unmount or refreshTime change
        } else {
            setSecondsAgo(null); // Reset if refreshTime is not valid
        }
    }, [refreshTime]);

    // 初始加载状态或没有数据时的显示
    if (refreshTime === 0 && allPeerList.length === 0) {
        return (
            <Card className="w-full max-w-2xl mx-auto my-6">
                <CardHeader>
                    <CardTitle>Online Peers</CardTitle>
                    <CardDescription>Waiting for initial data from the backend...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-20">
                        <p className="text-muted-foreground">Listening for peer updates...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-3xl mx-auto my-6 shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-semibold">Online Peers ({filteredPeerList.length})</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="show-only-reachable"
                            checked={showOnlyReachable}
                            onCheckedChange={setShowOnlyReachable}
                        />
                        <Label htmlFor="show-only-reachable">Only show reachable</Label>
                    </div>
                </div>
                <CardDescription>
                    Last updated: {refreshTime && refreshTime > 0 ? new Date(refreshTime * 1000).toLocaleString() : 'Not yet updated'}
                    {secondsAgo !== null && ` (${secondsAgo} seconds ago)`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {filteredPeerList.length === 0 ? (
                    <div className="flex items-center justify-center h-20">
                        <p className="text-muted-foreground">
                            {showOnlyReachable ? "No reachable peers currently detected." : "No online peers currently detected."}
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hostname</TableHead>
                                <TableHead>IP Addresses</TableHead>
                                <TableHead className="text-center">OS</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">Reachability</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPeerList.map((peer) => (
                                <TableRow key={peer.ID || peer.HostName} className="hover:bg-muted/50">
                                    <TableCell className="font-medium py-3">{peer.HostName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {peer.TailscaleIPs?.map((ip) => (
                                                <Badge variant="secondary" key={ip} className="text-xs">
                                                    {ip}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center" title={peer.OS}>
                                            {getOsIcon(peer.OS)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {peer.Online ? (
                                            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1">
                                                Online
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs px-2 py-1">
                                                Offline
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={characters[peer.ID || peer.HostName] === "NONE" || !characters[peer.ID || peer.HostName] ? "outline" : "default"}
                                               className={`text-xs px-2 py-1 ${characters[peer.ID || peer.HostName] === "OFFER" ? "bg-blue-500 text-white" : characters[peer.ID || peer.HostName] === "ANSWER" ? "bg-purple-500 text-white" : ""}`}>
                                            {characters[peer.ID || peer.HostName] || "NONE"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
