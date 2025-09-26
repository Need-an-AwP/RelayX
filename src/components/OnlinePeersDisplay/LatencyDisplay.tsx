import { useLatencyStore } from "@/stores";

export default function LatencyDisplay({ peerIP }: { peerIP: string }) {
    const { latencies } = useLatencyStore();

    return (
        <div className="flex items-center text-xs text-muted-foreground space-x-1">
            <span className="font-medium">{latencies[peerIP] || "--"}</span>
        </div>
    );
}
