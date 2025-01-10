import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
    DialogFooter
} from "@/components/ui/dialog"

import { useTailscale, useDB } from '@/stores'


const NetworkSelector = () => {
    const { status, loginName } = useTailscale.getState();
    if (!status) return null;

    const isInitialized = useDB(state => state.isInitialized);
    const networkID = useTailscale(state => state.networkID);
    const getAllNetworks = useDB(state => state.getAllNetworks);
    const [networks, setNetworks] = useState<any[]>([]);

    // use abort controller to privent unnecessary DB requests
    useEffect(() => {
        const abortController = new AbortController();
        const signal = abortController.signal;

        let isMounted = true;

        getAllNetworks()
            .then(res => {
                if (isMounted && !signal.aborted) {
                    console.log(res);
                    setNetworks(res);
                }
            })
            .catch(error => {
                if (!signal.aborted) {
                    console.error('Failed to fetch networks:', error);
                }
            });

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [getAllNetworks])


    return (
        <div>
            {networks.map((network) => (
                <Dialog key={network.id}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            {network.network_name}
                            {network.network_id === networkID &&
                                <span className="text-xs text-gray-500">(current)</span>
                            }
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Change to Network: <span className="font-light">{network.network_name}</span></DialogTitle>
                            <DialogDescription>
                                Change to this network will disconnect all webRTC connections and reload the whole app.
                            </DialogDescription>
                        </DialogHeader>
                        {network.network_id === networkID ?
                            <>
                                <span className="text-sm font-bold">You are already in {network.network_name} network.</span>
                                <DialogFooter className="mt-10 sm:justify-between">
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </>
                            :
                            <DialogFooter className="mt-10 sm:justify-between">
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button>Confirm</Button>
                                </DialogClose>
                            </DialogFooter>
                        }
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    )
}

export default NetworkSelector