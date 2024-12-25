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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Loader from "@/components/ui/loader"
import { Info } from "lucide-react"


const JoinDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [joinDialogLoading, setJoinDialogLoading] = useState(false)
    const [authKey, setAuthKey] = useState("");

    const handleJoinNetwork = (authKey: string) => {
        setJoinDialogLoading(true);
        // TODO: Implement join network logic
    }
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setJoinDialogLoading(false);
            setAuthKey(""); // Reset the join key when closing
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                    Join
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md" showCloseIcon={false}>
                <DialogHeader>
                    <DialogTitle>Join a New Network</DialogTitle>
                    <DialogDescription>
                        Enter an authKey to connect to an existing network.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Input
                        id="join-key"
                        value={authKey}
                        onChange={(e) => setAuthKey(e.target.value)}
                        className="col-span-3 text-xs"
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Info size={16} />
                        <p>
                            <strong>Headscale's</strong> authKey is a random 48 characters long string
                            <br />
                            <strong>Tailscale's</strong> authKey begins with "tskey-auth-"
                        </p>
                    </div>
                </div>
                <DialogFooter className="sm:justify-between mt-10">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            onClick={() => handleJoinNetwork(authKey)}
                            disabled={!(authKey.includes("tskey-auth") || authKey.length === 48)}
                        >
                            Join Network
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default JoinDialog;