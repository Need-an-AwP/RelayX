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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, CircleCheckBig } from "lucide-react";
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import Loader from "@/components/ui/loader";
import { useTailscale } from '@/stores'


const InviteDialog = () => {
    const isTailscaleAuthKey = useTailscale(state => state.isTailscaleAuthKey);
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false);
    const [expirationTime, setExpirationTime] = useState("1h");
    const [isReusable, setIsReusable] = useState(false);
    const [inviteDialogLoading, setInviteDialogLoading] = useState(false);
    const [authKey, setAuthKey] = useState<string>('');

    const handleInviteDevice = (expirationTime: string, isReusable: boolean) => {

    }

    const handleCopy = () => {
        if (authKey) {
            navigator.clipboard.writeText(authKey);
            toast({
                description:
                    <div className='flex flex-row items-center'>
                        <CircleCheckBig className='h-4 w-4 mr-2' />
                        <p>Key copied to clipboard</p>
                    </div>
            })
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={() => {
                setIsOpen(!isOpen)
                setInviteDialogLoading(false)
                setAuthKey('')
            }}
        >
            <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                    Invite
                </Button>
            </DialogTrigger>

            {isTailscaleAuthKey ?
                <DialogContent className="sm:max-w-md" showCloseIcon={false}>
                    <DialogHeader>
                        <DialogTitle>Invite New Device</DialogTitle>
                        <DialogDescription>
                            You are using Tailscale offical controller<br />
                            so you can only invite device by creating a new key in tailscale official control panel
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-2'>
                        <a href="https://login.tailscale.com/admin/settings/general" target="_blank">
                            https://login.tailscale.com/admin/settings/general
                        </a>
                        <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                            <span className="sr-only">Copy</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter className="sm:justify-between mt-10">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
                :
                <DialogContent className="sm:max-w-md" showCloseIcon={false}>
                    <DialogHeader>
                        <DialogTitle>Invite New Device</DialogTitle>
                        <DialogDescription>
                            Share this key to invite a new device into your network.
                        </DialogDescription>
                    </DialogHeader>

                    {authKey === null ?
                        <div className="grid grid-rows-2 gap-2">
                            <div className="flex flex-row justify-between">
                                <p className="my-auto">expiration time</p>
                                <Select value={expirationTime} onValueChange={setExpirationTime}>
                                    <SelectTrigger className="w-1/2">
                                        <SelectValue placeholder="Select expiration" />
                                    </SelectTrigger>
                                    <SelectContent className="h-[300px]">
                                        <SelectItem value="10m">10 minutes</SelectItem>
                                        <SelectItem value="30m">30 minutes</SelectItem>
                                        <SelectItem value="1h">1 hour</SelectItem>
                                        <SelectItem value="6h">6 hours</SelectItem>
                                        <SelectItem value="12h">12 hours</SelectItem>
                                        <SelectItem value="1d">1 day</SelectItem>
                                        <SelectItem value="7d">7 days</SelectItem>
                                        <SelectItem value="1m">1 month</SelectItem>
                                        <SelectItem value="3m">3 months</SelectItem>
                                        <SelectItem value="6m">6 months</SelectItem>
                                        <SelectItem value="1y">1 year</SelectItem>
                                        <SelectItem value="99y">Never expire</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-row justify-between">
                                <p className="my-auto ">reusable</p>
                                <Switch className="scale-120 mt-2" checked={isReusable} onCheckedChange={setIsReusable} />
                            </div>
                        </div>
                        :
                        <div className="flex flex-col text-sm gap-2">
                            <div className="flex justify-between gap-2">
                                <Input
                                    id="link"
                                    value={authKey}
                                    className="text-xs"
                                    readOnly
                                />
                                <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                                    <span className="sr-only">Copy</span>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-col text-xs text-neutral-300 mb-4">
                                <span>this key's expiration time is {expirationTime}</span>
                                <span>and it is {isReusable ? "reusable" : "not reusable"}</span>
                            </div>
                        </div>
                    }

                    <DialogFooter className="sm:justify-between mt-10">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Close
                            </Button>
                        </DialogClose>
                        <Button
                            disabled={authKey.length === 0}
                            className="bg-neutral-200"
                            onClick={() => {
                                handleInviteDevice(expirationTime, isReusable);
                            }}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            }
        </Dialog>
    );
}

export default InviteDialog