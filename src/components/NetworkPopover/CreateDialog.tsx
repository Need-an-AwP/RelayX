import { useState } from 'react';
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
import { Button } from "@/components/ui/button"
import { Dices, Copy, CircleCheck, CircleCheckBig } from "lucide-react";
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { adjectives, nouns } from '@/utils/wordList';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTailscale } from "@/stores"


const CreateDialog = () => {
    const isTailscaleAuthKey = useTailscale(state => state.isTailscaleAuthKey);
    const { toast } = useToast()
    const [newNetworkInfo, setNewNetworkInfo] = useState(null)
    const [networkName, setNetworkName] = useState("");

    const generateRandomName = () => {
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        setNetworkName(`${randomAdjective}-${randomNoun}`);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                    Create a New Network
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md" showCloseIcon={false}>
                <DialogHeader>
                    <DialogTitle>
                        Create a New Network
                    </DialogTitle>
                    <DialogDescription>
                        Choose the way to create a new network
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue={isTailscaleAuthKey ? "tailscale" : "headscale"} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tailscale">Tailscale</TabsTrigger>
                        <TabsTrigger value="headscale">Headscale</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tailscale">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Create a New Network
                                    <br />
                                    in Tailscale
                                </CardTitle>

                            </CardHeader>
                            <div className='flex p-2 m-2 text-red-500 items-center justify-center'>
                                <strong>Tailscale controller method is not supported now</strong>
                            </div>
                            <CardContent className="space-y-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">STEP 1: </p>login Tailscale control panel with a new account
                                    <br />
                                    <a href="https://login.tailscale.com/admin/machines" target="_blank" className="text-sky-500">https://login.tailscale.com/admin/machines</a>
                                    <p className="text-muted-foreground">STEP 2: </p>create a new auth key
                                    <br />
                                    <p className="text-muted-foreground">STEP 3: </p>paste your new auth key in the join dialog
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="headscale">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Create a New Network
                                    <br />
                                    in Headscale
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                Current Headscale controller url is <a>http://1.12.226.82:3000</a>
                                {newNetworkInfo !== null ?
                                    <div>

                                    </div>
                                    :
                                    <div className='space-y-4'>
                                        <DialogHeader>
                                            <DialogTitle>Create New Network</DialogTitle>
                                            <DialogDescription>
                                                Enter a name for your new network.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex items-center space-x-2">

                                            <TooltipProvider delayDuration={100} >
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Input
                                                            id="network-name"
                                                            value={networkName}
                                                            onChange={(e) => setNetworkName(e.target.value.replace(/[^a-z0-9-_]/g, ''))}
                                                            className="flex-grow text-sm"
                                                            placeholder="Enter network name"
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" sideOffset={10} className="text-xs border-0">
                                                        <span>Only lowercase letters, numbers, - and _ are allowed</span>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={generateRandomName}
                                                title="Generate random name"
                                            >
                                                <Dices className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="sm:justify-between mt-10">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default CreateDialog