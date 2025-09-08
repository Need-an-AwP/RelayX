import { memo, useMemo, useState } from 'react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge";
import { Laptop, Server, Smartphone, Globe } from 'lucide-react';
import type { PeerStatus, PeerState } from "@/types"

const OsIcon = memo(({ os }: { os?: string }) => {
    if (!os) return <Laptop className="h-4 w-4 text-muted-foreground" />;
    const lowerOs = os.toLowerCase();
    if (lowerOs.includes('windows')) return <Laptop className="h-4 w-4 text-blue-500" />;
    if (lowerOs.includes('linux')) return <Server className="h-4 w-4 text-orange-500" />;
    if (lowerOs.includes('darwin') || lowerOs.includes('macos')) return <Laptop className="h-4 w-4 text-gray-500" />;
    if (lowerOs.includes('android')) return <Smartphone className="h-4 w-4 text-green-500" />;
    if (lowerOs.includes('ios')) return <Smartphone className="h-4 w-4 text-purple-500" />;
    return <Globe className="h-4 w-4 text-muted-foreground" />;
});

const PeerItem = ({ peerStatus, userState }: { peerStatus: PeerStatus, userState: PeerState }) => {
    const peer = peerStatus
    const user = userState

    const onlineStyle = useMemo(() =>
        `text-[10px] px-1 py-0 cursor-default ${peer.Online ? "bg-green-500 text-white" : ""}`,
        [peer.Online]
    );

    return (
        <Dialog>
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

                            {/* <LatencyDisplay peerIP={peerIP} /> */}

                        </div>
                        <Separator />
                    </>)}

                    <div className="flex justify-between items-center mb-0">
                        <div className="font-medium text-muted-foreground truncate" title="HostName">{peer.HostName}</div>
                        <div className="flex items-center gap-1">
                            <div title={peer.OS}><OsIcon os={peer.OS} /></div>
                            <Badge
                                className={onlineStyle}
                                variant={peer.Online ? "default" : "secondary"}>
                                {peer.Online ? "Online" : "Offline"}
                            </Badge>

                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent showCloseButton={true} className="@container">
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
                    {/* {user && (<div className='max-w-[100cqw] overflow-hidden'>
                        <pre className="text-sm text-green-500 whitespace-pre-wrap">
                            {JSON.stringify(user, null, 2)}
                        </pre>
                    </div>)} */}
                    {/* {user && (
                        <div className='max-w-[100cqw] overflow-hidden'>
                            <div className="bg-green-800 border border-green-200 rounded-md p-3">
                                <h4 className="text-sm font-semibold text-green-700 mb-2">User State</h4>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">User Name:</span>
                                        <span className="font-medium">{user.userName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">In Chat:</span>
                                        <Badge variant={user.isInChat ? "default" : "secondary"} className="h-4">
                                            {user.isInChat ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Input Muted:</span>
                                        <Badge variant={user.isInputMuted ? "destructive" : "secondary"} className="h-4">
                                            {user.isInputMuted ? "Muted" : "Active"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Output Muted:</span>
                                        <Badge variant={user.isOutputMuted ? "destructive" : "secondary"} className="h-4">
                                            {user.isOutputMuted ? "Muted" : "Active"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sharing Screen:</span>
                                        <Badge variant={user.isSharingScreen ? "default" : "secondary"} className="h-4">
                                            {user.isSharingScreen ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sharing Audio:</span>
                                        <Badge variant={user.isSharingAudio ? "default" : "secondary"} className="h-4">
                                            {user.isSharingAudio ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )} */}
                    <div className="h-[50vh] w-[100cqw] bg-muted rounded-md p-1">
                        <ScrollArea className="h-full w-full">
                            {/*  <pre className="text-sm">
                                {JSON.stringify(peer, null, 2)}
                            </pre> */}
                            <div className="p-3 space-y-3">
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Connection Info</h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status:</span>
                                            <Badge variant={peer.Online ? "default" : "secondary"} className="h-4">
                                                {peer.Online ? "Online" : "Offline"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">DNS Name:</span>
                                            <span className="font-mono text-xs">{peer.DNSName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Current Address:</span>
                                            <span className="font-mono text-xs">{peer.CurAddr || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">DERP Relay:</span>
                                            <span className="font-mono text-xs">{peer.Relay || "N/A"}</span>
                                        </div>
                                        {peer.PeerRelay && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Peer Relay:</span>
                                                <span className="font-mono text-xs">{peer.PeerRelay}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Device Info</h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Operating System:</span>
                                            <div className="flex items-center gap-1">
                                                <OsIcon os={peer.OS} />
                                                <span className="font-medium">{peer.OS || "Unknown"}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Host Name:</span>
                                            <span className="font-medium">{peer.HostName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Machine ID:</span>
                                            <span className="font-mono text-xs">{String(peer.ID).slice(0, 16)}...</span>
                                        </div>
                                        {peer.Created && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Registered:</span>
                                                <span className="text-xs">{new Date(peer.Created).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Network Stats</h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Bytes Sent:</span>
                                            <span className="font-mono text-xs">{(peer.TxBytes / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Bytes Received:</span>
                                            <span className="font-mono text-xs">{(peer.RxBytes / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Active:</span>
                                            <Badge variant={peer.Active ? "default" : "secondary"} className="h-4">
                                                {peer.Active ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                        {peer.LastWrite && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Last Activity:</span>
                                                <span className="text-xs">{new Date(peer.LastWrite).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {peer.LastHandshake && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Last Handshake:</span>
                                                <span className="text-xs">{new Date(peer.LastHandshake).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Node Features</h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Exit Node:</span>
                                            <Badge variant={peer.ExitNode ? "default" : "secondary"} className="h-4">
                                                {peer.ExitNode ? "Active" : "Not Active"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Exit Node Option:</span>
                                            <Badge variant={peer.ExitNodeOption ? "default" : "secondary"} className="h-4">
                                                {peer.ExitNodeOption ? "Available" : "Not Available"}
                                            </Badge>
                                        </div>
                                        {peer.ShareeNode !== undefined && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Shared Node:</span>
                                                <Badge variant={peer.ShareeNode ? "default" : "secondary"} className="h-4">
                                                    {peer.ShareeNode ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                        )}
                                        {peer.Expired !== undefined && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Key Status:</span>
                                                <Badge variant={peer.Expired ? "destructive" : "default"} className="h-4">
                                                    {peer.Expired ? "Expired" : "Valid"}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Network Connectivity</h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">In Network Map:</span>
                                            <Badge variant={peer.InNetworkMap ? "default" : "destructive"} className="h-4">
                                                {peer.InNetworkMap ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">In MagicSock:</span>
                                            <Badge variant={peer.InMagicSock ? "default" : "destructive"} className="h-4">
                                                {peer.InMagicSock ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">In Engine:</span>
                                            <Badge variant={peer.InEngine ? "default" : "destructive"} className="h-4">
                                                {peer.InEngine ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {peer.Addrs && peer.Addrs.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Available Endpoints</h4>
                                            <div className="space-y-1">
                                                {peer.Addrs.slice(0, 5).map((addr, index) => (
                                                    <div key={index} className="font-mono text-xs bg-background rounded px-2 py-1 flex justify-between">
                                                        <span>{addr}</span>
                                                        {addr === peer.CurAddr && (
                                                            <Badge variant="default" className="text-[10px] px-1 py-0">Current</Badge>
                                                        )}
                                                    </div>
                                                ))}
                                                {peer.Addrs.length > 5 && (
                                                    <div className="text-muted-foreground text-xs italic">
                                                        ... and {peer.Addrs.length - 5} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {peer.Tags && peer.Tags.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">ACL Tags</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {peer.Tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {peer.PrimaryRoutes && peer.PrimaryRoutes.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Primary Routes</h4>
                                            <div className="space-y-1">
                                                {peer.PrimaryRoutes.map((route, index) => (
                                                    <div key={index} className="font-mono text-xs bg-background rounded px-2 py-1">
                                                        {route.toString()}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {peer.PeerAPIURL && peer.PeerAPIURL.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Peer API</h4>
                                            <div className="space-y-1">
                                                {peer.PeerAPIURL.map((url, index) => (
                                                    <div key={index} className="font-mono text-xs bg-background rounded px-2 py-1">
                                                        {url}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default PeerItem