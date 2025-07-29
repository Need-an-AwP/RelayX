import { useEffect, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { RotateCcw, Copy, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator"
import { useTailscaleStore } from "@/stores/tailscaleStore";


export default function TailscaleSettings() {
    const tailscaleStatus = useTailscaleStore((state) => state.tailscaleStatus);
    const [currentTsKey, setCurrentTsKey] = useState('');
    const [currentHostName, setCurrentHostName] = useState('');

    useEffect(() => {
        let isMounted = true;

        window.ipcBridge.getEnvConfig()
            .then(config => {
                if (isMounted) {
                    setCurrentTsKey(config.TAILSCALE_AUTH_KEY);
                    setCurrentHostName(config.NODE_HOSTNAME);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleCopy = (e: React.MouseEvent<HTMLButtonElement>, content: string) => {
        navigator.clipboard.writeText(content);
        const target = e.currentTarget; // 保存引用
        target.classList.add('copied');
        setTimeout(() => {
            target.classList.remove('copied');
        }, 2000);
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Tailscale Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 justify-between">
                        <Label className="whitespace-nowrap">current Tailnet:</Label>
                        <div className="flex gap-2 w-[80%] text-green-300 text-sm">
                            <span>{tailscaleStatus?.CurrentTailnet?.Name}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex gap-2 justify-between">
                        <Label className="whitespace-nowrap">Tailscale Key:</Label>
                        <div className="flex gap-2 w-[80%]">
                            <Input value={currentTsKey} className="!text-xs" onChange={(e) => setCurrentTsKey(e.target.value)} />
                            <Button
                                size="icon"
                                variant="outline"
                                className="cursor-pointer select-none group"
                                onClick={(e) => {
                                    handleCopy(e, currentTsKey);
                                }}
                            >
                                <Copy className="h-3 w-3 group-[.copied]:hidden" />
                                <Check className="h-3 w-3 hidden group-[.copied]:block text-green-500" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-between">
                        <Label className="whitespace-nowrap">Host name:</Label>
                        <div className="flex gap-2 w-[80%]">
                            <Input value={currentHostName} className="!text-xs" onChange={(e) => setCurrentHostName(e.target.value)} />
                            <Button
                                size="icon"
                                variant="outline"
                                className="cursor-pointer select-none group"
                                onClick={(e) => {
                                    handleCopy(e, currentHostName);
                                }}
                            >
                                <Copy className="h-3 w-3 group-[.copied]:hidden" />
                                <Check className="h-3 w-3 hidden group-[.copied]:block text-green-500" />
                            </Button>
                        </div>
                    </div>


                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full cursor-pointer select-none">
                                Confirm and Restart
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmation</AlertDialogTitle>
                                <AlertDialogDescription>
                                    These changes will take effect after the tailscale client restart.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction disabled={true}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Separator />

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full cursor-pointer select-none">
                                <RotateCcw className="h-3 w-3" />
                                <span>Restart Tailscale embeded client forcely</span>
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmation</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will restart the tailscale embeded client forcely.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction disabled={true}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>

    )
}