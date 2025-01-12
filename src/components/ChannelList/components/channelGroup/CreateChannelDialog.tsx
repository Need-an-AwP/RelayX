import { useState } from "react";
import { Button } from "@/components/ui/button"
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
import { Plus, Copy } from "lucide-react";
import { useChannel } from "@/stores";


const CreateChannelDialog = ({ type }: { type: 'text' | 'voice' }) => {
    const [channelName, setChannelName] = useState("");
    const isPresetChannels = useChannel((state) => state.isPresetChannels);

    const handleCreateChannel = async () => {

    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="rounded-md hover:bg-secondary/60 p-1 m-2 cursor-pointer">
                    <Plus className="w-4 h-4" />
                </div>
            </DialogTrigger>
            <DialogContent >

                <DialogHeader>
                    <DialogTitle>Create a {type} channel</DialogTitle>
                    <DialogDescription>
                        Create a new channel with a name.
                    </DialogDescription>
                </DialogHeader>
                {isPresetChannels ? <>
                    <div className="text-sm">
                        <p>You are using preset channels</p>
                        <p>Creating new channel is not allowed</p>
                    </div>
                    <DialogFooter className="sm:justify-end mt-10">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </> : <>
                    <div className="flex flex-row items-center space-x-4">
                        <span className="text-sm whitespace-nowrap">Channel name</span>
                        <Input
                            id="link"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                        />

                    </div>
                    <DialogFooter className="sm:justify-between mt-10">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Close
                            </Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button
                                type="submit"
                                disabled={channelName.length === 0}
                                onClick={handleCreateChannel}
                            >Create</Button>
                        </DialogClose>
                    </DialogFooter>
                </>}

            </DialogContent>
        </Dialog>
    )
}

export default CreateChannelDialog