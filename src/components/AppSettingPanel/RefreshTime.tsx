import { useEffect, useState } from "react";
import { useOnlinePeersStore } from "@/stores";
import { Clock } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function RefreshTime() {
    const refreshTime = useOnlinePeersStore((state) => state.refreshTime);
    const [secondsAgo, setSecondsAgo] = useState<number | null>(null);


    useEffect(() => {
        if (refreshTime && refreshTime > 0) {
            const updateSecondsAgo = () => {
                const nowInSeconds = Math.floor(Date.now() / 1000);
                setSecondsAgo(nowInSeconds - refreshTime);
            };
            updateSecondsAgo();
            const intervalId = setInterval(updateSecondsAgo, 1000);
            return () => clearInterval(intervalId);
        } else {
            setSecondsAgo(null);
        }
    }, [refreshTime]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Peer Refresh Time</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2 justify-center items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {secondsAgo !== null ? `${secondsAgo}sec ago` : 'Not updated'}
                    </div>
                    <span className="break-all min-w-0">{refreshTime && refreshTime > 0 ? new Date(refreshTime * 1000).toLocaleString() : '尚未更新'}</span>
                </div>
            </CardContent>
        </Card>

    )
}