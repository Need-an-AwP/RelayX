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
import { RotateCcw, Copy, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator"


export default function TailscaleSettings() {
    const [currentTsKey, setCurrentTsKey] = useState('');
    const [currentHostName, setCurrentHostName] = useState('');

    useEffect(() => {
        let isMounted = true;

        window.ipcBridge.getEnvConfig()
            .then(config => {
                if (isMounted) {
                    console.log(config);
                    setCurrentTsKey(config.TAILSCALE_AUTH_KEY);
                    setCurrentHostName(config.NODE_HOSTNAME);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tailscale Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2">

                    <div className="flex gap-2 justify-between">
                        <Label className="whitespace-nowrap">Tailscale Key:</Label>
                        <div className="flex gap-2 w-[80%]">
                            <Input value={currentTsKey} className="!text-xs" onChange={(e) => setCurrentTsKey(e.target.value)} />
                            <Button size="icon" variant="outline" className="cursor-pointer select-none">
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-between">
                        <Label className="whitespace-nowrap">Host name:</Label>
                        <div className="flex gap-2 w-[80%]">
                            <Input value={currentHostName} className="!text-xs" onChange={(e) => setCurrentHostName(e.target.value)} />
                            <Button size="icon" variant="outline" className="cursor-pointer select-none">
                                <Copy className="h-3 w-3" />
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