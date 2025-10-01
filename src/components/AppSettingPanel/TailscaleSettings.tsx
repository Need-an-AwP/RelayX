import { useEffect, useState } from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Copy, Check, Eye, EyeOff, Network, Key, Settings, IdCardLanyard } from "lucide-react";
import { Separator } from "@/components/ui/separator"
import validateTsAuthKey from "@/utils/validateTsAuthKey";
import { useTailscaleStore } from "@/stores"

export default function TailscaleSettings() {
    const { tailscaleStatus } = useTailscaleStore();
    const [loginMethod, setLoginMethod] = useState<'key' | 'account' | null>(null);
    const [currentTsKey, setCurrentTsKey] = useState('');
    const [isValidKey, setIsValidKey] = useState(true);
    const [authKeyVisible, setAuthKeyVisible] = useState(false);
    const [currentHostName, setCurrentHostName] = useState('');

    useEffect(() => {
        let isMounted = true;
        window.ipcBridge.getUserConfig()
            .then(config => {
                if (config.loginMethod === 'account') {
                    setLoginMethod('account');
                    setCurrentHostName(tailscaleStatus?.Self?.HostName || '');
                } else if (config.loginMethod === 'key') {
                    setLoginMethod('key');
                    window.ipcBridge.getEnvConfig()
                        .then(config => {
                            if (isMounted) {
                                setCurrentTsKey(config.TAILSCALE_AUTH_KEY);
                                setCurrentHostName(config.NODE_HOSTNAME);
                            }
                        });
                }
            })

        return () => {
            isMounted = false;
        };
    }, []);

    const handleCopy = (e: React.MouseEvent<HTMLButtonElement>, content: string) => {
        navigator.clipboard.writeText(content);
        const target = e.currentTarget;
        target.classList.add('copied');
        setTimeout(() => {
            target.classList.remove('copied');
        }, 2000);
    }

    const getStatusBadge = () => {
        if (!tailscaleStatus) return <Badge variant="secondary">Unknown</Badge>;
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Tailscale Settings
                </CardTitle>
                <CardDescription>
                    Manage your Tailscale embedded client configuration
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Connection Status */}
                    <div className="border rounded-md p-3 bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Network className="h-4 w-4" />
                                Connection Status
                            </h4>
                            {getStatusBadge()}
                        </div>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Current Tailnet:</span>
                                <span className="font-medium text-green-600">
                                    {tailscaleStatus?.CurrentTailnet?.Name || "Not connected"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Configuration Settings */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Configuration
                        </h4>

                        {loginMethod === 'key' ? (
                            <>
                                {/* Hostname Setting */}
                                <div className="border rounded-md p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">
                                            <IdCardLanyard className="w-4 h-4" />
                                            Host Name
                                        </Label>
                                        <Badge variant="outline" className="text-xs">Identifier</Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={currentHostName}
                                            className={`text-xs flex-1`}
                                            onChange={(e) => setCurrentHostName(e.target.value)}
                                            placeholder="Enter hostname"
                                        />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="cursor-pointer select-none group shrink-0"
                                            onClick={(e) => handleCopy(e, currentHostName)}
                                            disabled={!currentHostName}
                                        >
                                            <Copy className="h-3 w-3 group-[.copied]:hidden" />
                                            <Check className="h-3 w-3 hidden group-[.copied]:block text-green-500" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Auth Key Setting */}
                                <div className={`border rounded-md p-3 ${!isValidKey && 'border-red-500'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <Key className="h-4 w-4" />
                                            Tailscale Auth Key
                                        </Label>
                                        <Badge variant="outline" className="text-xs">Secret</Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={currentTsKey}
                                            className={`text-xs flex-1`}
                                            onChange={(e) => {
                                                setIsValidKey(validateTsAuthKey(e.target.value));
                                                setCurrentTsKey(e.target.value)
                                            }}
                                            type={authKeyVisible ? "text" : "password"}
                                            placeholder="tskey-auth-..."
                                        />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="cursor-pointer select-none shrink-0"
                                            onClick={() => setAuthKeyVisible(!authKeyVisible)}
                                        >
                                            {authKeyVisible ? <EyeOff className='h-3 w-3' /> : <Eye className='h-3 w-3' />}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="cursor-pointer select-none group shrink-0"
                                            onClick={(e) => handleCopy(e, currentTsKey)}
                                            disabled={!currentTsKey}
                                        >
                                            <Copy className="h-3 w-3 group-[.copied]:hidden" />
                                            <Check className="h-3 w-3 hidden group-[.copied]:block text-green-500" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Account Mode Display */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border rounded-md p-3 bg-muted/30">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <IdCardLanyard className="h-4 w-4" />
                                                Device Information
                                            </Label>
                                            <Badge variant="outline" className="text-xs">Read-only</Badge>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-xs text-muted-foreground">Hostname:</span>
                                                <span className="text-xs font-mono bg-background rounded px-2 py-1">
                                                    {currentHostName || "Not set"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs text-muted-foreground">IP Address:</span>
                                                <span className="text-xs font-mono bg-background rounded px-2 py-1">
                                                    {tailscaleStatus?.Self?.TailscaleIPs?.[0] || "Not assigned"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border rounded-md p-3 bg-blue-50/50 dark:bg-blue-950/30">
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-1">
                                                <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                    Logged in via Tailscale Account
                                                </h5>
                                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                                    You are currently using Tailscale account login mode, and device configuration is automatically managed by Tailscale services.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </>
                        )}

                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {/* Apply Configuration */}
                        {loginMethod === 'key' ?
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="default" className="w-full cursor-pointer select-none">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Apply Configuration & Restart
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Apply Configuration</DialogTitle>
                                        <DialogDescription>
                                            This will update your Tailscale settings and restart the embedded client.
                                            The connection may be temporarily interrupted.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <div className="space-y-3">
                                            <div className="border rounded-md p-3 bg-muted/30">
                                                <h5 className="text-sm font-medium mb-2">Configuration Changes</h5>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-muted-foreground text-xs">New Hostname:</span>
                                                        <span className="font-mono text-xs bg-background rounded px-2 py-1 break-all">
                                                            {currentHostName || "unchanged"}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-muted-foreground text-xs">Auth Key:</span>
                                                        <span className="font-mono text-xs bg-background rounded px-2 py-1 break-all">
                                                            {authKeyVisible ? currentTsKey : currentTsKey.replace(/./g, '•')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button disabled={true}>Apply Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog> :
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full cursor-pointer select-none">
                                        <Key className="h-4 w-4 mr-2" />
                                        Logout from Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Logout from Tailscale Account</DialogTitle>
                                        <DialogDescription>
                                            This will log you out from your Tailscale account and disconnect from the current tailnet.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        
                                    </div>
                                    <DialogFooter>
                                        <DialogClose><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button variant="destructive" disabled={true}>
                                            Confirm Logout
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        }
                        {/* Force Restart */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="w-full cursor-pointer select-none">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Force Restart Client
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Force Restart</DialogTitle>
                                    <DialogDescription>
                                        This will forcefully restart the Tailscale embedded client.
                                        Use this only if the client is unresponsive.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                        <p className="text-sm text-yellow-800">
                                            <strong>Warning:</strong> This action may cause temporary connection loss.
                                            Only use if the client is not responding to normal operations.
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose><Button variant="outline">Cancel</Button></DialogClose>
                                    <Button disabled={true}>Force Restart</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card >
    )
}