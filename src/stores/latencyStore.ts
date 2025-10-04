import { create } from 'zustand';

interface LatencyStateStore {
    latencies: Record<string, string>; // peerIP -> latency string
    targetBitrates: Record<string, number>; // peerIP -> target bitrate
    updateLatencies: (newLatencies: Record<string, string>) => void;
    updateTargetBitrates: (newTargetBitrates: Record<string, number>) => void;
}

const useLatencyStore = create<LatencyStateStore>((set) => ({
    latencies: {},
    targetBitrates: {},
    updateLatencies: (newLatencies) => set(() => ({ latencies: newLatencies })),
    updateTargetBitrates: (newTargetBitrates) => set(() => ({ targetBitrates: newTargetBitrates }))
}));

export { useLatencyStore }