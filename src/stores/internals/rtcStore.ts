import { create } from "zustand"
import type { RTCStore, RTCStatus } from "@/types/internals/rtcTypes"

const useRTC = create<RTCStore>((set) => ({
    states: {},
    setStatus: (peerIP, status) =>
        set((state) => ({
            states: {
                ...state.states,
                [peerIP]: status
            }
        })),
    updateStatus: (peerIP, updates) =>
        set((state) => {
            const currentStatus = state.states[peerIP];
            if (!currentStatus) {
                // 如果当前 peerIP 没有状态，则创建新的状态
                return {
                    states: {
                        ...state.states,
                        [peerIP]: updates as RTCStatus
                    }
                };
            }
            // 如果已有状态，则更新现有状态
            return {
                states: {
                    ...state.states,
                    [peerIP]: { ...currentStatus, ...updates }
                }
            };
        }),
    removeStatus: (peerIP) =>
        set((state) => {
            const newStates = { ...state.states };
            delete newStates[peerIP];
            return { states: newStates };
        }),
}))

export { useRTC }