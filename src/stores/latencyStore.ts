import {create} from 'zustand';

interface LatencyStateStore {
    latencies: Record<string, string>; // peerIP -> latency string
    updateLatencies: (newLatencies: Record<string, string>) => void;
}

const useLatencyStore = create<LatencyStateStore>((set) => ({
    latencies: {},
    updateLatencies: (newLatencies) => set(() => ({ latencies: newLatencies }))
}));

export { useLatencyStore }