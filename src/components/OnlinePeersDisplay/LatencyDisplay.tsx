import { useLatencyStore, useLocalUserStateStore, useRemoteUsersStore } from "@/stores";

export default function LatencyDisplay({ peerIP }: { peerIP: string }) {
    const { latencies, targetBitrates } = useLatencyStore();
    const { userState } = useLocalUserStateStore();
    const { peers } = useRemoteUsersStore();

    return (
        <div className="flex flex-col items-end text-xs text-muted-foreground">
            <span className="font-medium" title="current latency">
                {latencies[peerIP] || "--"}
            </span>
            {userState.isInChat && peers[peerIP].isInChat && <span className="font-medium" title="available outbound bandwidth">
                {targetBitrates[peerIP] ? (targetBitrates[peerIP] / 1000) + " kbps" : "--"}
            </span>}
        </div>
    );
}
