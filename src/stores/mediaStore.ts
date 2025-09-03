import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { TransceiverLabel, TrackType } from "@/types";

export interface LabeledTracks {
    [label: string]: MediaStreamTrack
}

export interface TypedTracks {
    audio: LabeledTracks
    video: LabeledTracks
}

interface TrackAudioNodes {
    sourceNode: MediaStreamAudioSourceNode
    gainNode: GainNode
}


interface useMediaStore {
    mixedAudioStream: MediaStream
    outputGainNode: GainNode
    peerTracks: {
        [peerIP: peerIP]: Partial<TypedTracks>
    }
    trackAudioNodes: {
        [peerIP: peerIP]: {
            [label in TransceiverLabel]?: TrackAudioNodes
        }
    }
    peerAnalysers: {
        [peerIP: peerIP]: AnalyserNode
    }
    peerGainNodes: {
        [peerIP: peerIP]: {
            [label in TransceiverLabel]?: GainNode
        }
    }
    

    addTrack: (peerIP: peerIP, type: TrackType, label: TransceiverLabel, track: MediaStreamTrack) => void
    removeTrack: (peerIP: peerIP, type: TrackType, label: TransceiverLabel) => void
    removePeerTracks: (peerIP: peerIP) => void
    getPeerTracks: (peerIP: peerIP) => Partial<TypedTracks> | undefined
    getPeerAudioTracks: (peerIP: peerIP) => LabeledTracks | undefined
    getPeerVideoTracks: (peerIP: peerIP) => LabeledTracks | undefined
    getPeerAnalyserNode: (peerIP: peerIP) => AnalyserNode | undefined
    getPeerGainNode: (peerIP: peerIP, label: TransceiverLabel) => GainNode | undefined
    setPeerGainValue: (peerIP: peerIP, label: TransceiverLabel, value: number) => void
    resumeAudioContext: () => Promise<void>
    getAudioContext: () => AudioContext
    setOutputGainValue: (value: number) => void
}

// for every peer, audio analyser is shared in all audio tracks

export const useMediaStore = create<useMediaStore>()(
    immer((set, get) => {
        const audioContext = new AudioContext();
        console.log(`[mediaStore] Created global AudioContext. State: ${audioContext.state}`);
        const destinationNode = audioContext.createMediaStreamDestination();
        const outputGainNode = audioContext.createGain();
        outputGainNode.connect(destinationNode)

        return {
            mixedAudioStream: destinationNode.stream,
            outputGainNode: outputGainNode,
            peerTracks: {},
            trackAudioNodes: {},
            peerAnalysers: {},
            peerGainNodes: {},

            addTrack: (peerIP, type, label, track) => {
                set((state) => {
                    // 更新peerTracks
                    if (!state.peerTracks[peerIP]) {
                        state.peerTracks[peerIP] = {};
                    }
                    if (!state.peerTracks[peerIP][type]) {
                        state.peerTracks[peerIP][type] = {};
                    }
                    state.peerTracks[peerIP][type]![label] = track;

                    // 如果是视频轨道，直接返回
                    if (type === 'video') {
                        return;
                    }

                    // 初始化trackAudioNodes
                    if (!state.trackAudioNodes[peerIP]) {
                        state.trackAudioNodes[peerIP] = {};
                    }

                    // 初始化peerAnalyser（每个peer共享一个）
                    if (!state.peerAnalysers[peerIP]) {
                        state.peerAnalysers[peerIP] = audioContext.createAnalyser();
                    }

                    // 初始化peerGainNodes
                    if (!state.peerGainNodes[peerIP]) {
                        state.peerGainNodes[peerIP] = {};
                    }

                    const sourceStream = new MediaStream([track])
                    const fakeAudioElement = new Audio()
                    fakeAudioElement.srcObject = sourceStream
                    fakeAudioElement.autoplay = true
                    fakeAudioElement.muted = true
                    fakeAudioElement.controls = false
                    fakeAudioElement.volume = 0

                    const sourceNode = audioContext.createMediaStreamSource(sourceStream)
                    const gainNode = audioContext.createGain()

                    sourceNode.connect(gainNode)
                    gainNode.connect(outputGainNode)
                    gainNode.connect(state.peerAnalysers[peerIP])

                    // 存储节点
                    state.trackAudioNodes[peerIP][label] = { sourceNode, gainNode };
                    state.peerGainNodes[peerIP][label] = gainNode;
                })
            },

            removeTrack: (peerIP, type, label) => {
                set((state) => {
                    // 移除peerTracks中的轨道
                    if (state.peerTracks[peerIP]?.[type]?.[label]) {
                        delete state.peerTracks[peerIP][type]![label];
                        
                        // 如果该类型下没有轨道了，删除该类型
                        if (Object.keys(state.peerTracks[peerIP][type]!).length === 0) {
                            delete state.peerTracks[peerIP][type];
                        }
                        
                        // 如果该peer没有任何轨道了，删除该peer
                        if (Object.keys(state.peerTracks[peerIP]).length === 0) {
                            delete state.peerTracks[peerIP];
                        }
                    }

                    // 如果是视频轨道，直接返回
                    if (type === 'video') {
                        return;
                    }

                    // 清理音频节点
                    const trackNodes = state.trackAudioNodes[peerIP]?.[label];
                    if (trackNodes) {
                        trackNodes.gainNode.disconnect();
                        trackNodes.sourceNode.disconnect();
                        delete state.trackAudioNodes[peerIP][label];
                    }

                    // 清理gain节点
                    if (state.peerGainNodes[peerIP]?.[label]) {
                        delete state.peerGainNodes[peerIP][label];
                    }

                    // 检查该peer是否还有音频轨道
                    const hasAudioTracks = state.trackAudioNodes[peerIP] && 
                        Object.keys(state.trackAudioNodes[peerIP]).length > 0;

                    if (!hasAudioTracks) {
                        // 清理该peer的所有音频相关资源
                        if (state.trackAudioNodes[peerIP]) {
                            delete state.trackAudioNodes[peerIP];
                        }
                        if (state.peerGainNodes[peerIP]) {
                            delete state.peerGainNodes[peerIP];
                        }
                        if (state.peerAnalysers[peerIP]) {
                            state.peerAnalysers[peerIP].disconnect();
                            delete state.peerAnalysers[peerIP];
                        }
                    }
                })
            },

            removePeerTracks: (peerIP) => {
                set((state) => {
                    // 清理peerTracks
                    delete state.peerTracks[peerIP];

                    // 清理所有音频节点
                    if (state.trackAudioNodes[peerIP]) {
                        Object.values(state.trackAudioNodes[peerIP]).forEach(nodes => {
                            if (nodes) {
                                nodes.gainNode.disconnect();
                                nodes.sourceNode.disconnect();
                            }
                        });
                        delete state.trackAudioNodes[peerIP];
                    }

                    // 清理gain节点
                    delete state.peerGainNodes[peerIP];

                    // 清理analyser
                    if (state.peerAnalysers[peerIP]) {
                        state.peerAnalysers[peerIP].disconnect();
                        delete state.peerAnalysers[peerIP];
                    }
                })
            },

            setOutputGainValue: (value: number) => {
                outputGainNode.gain.value = value
            },

            getPeerTracks: (peerIP) => {
                return get().peerTracks[peerIP]
            },

            getPeerAudioTracks: (peerIP) => {
                return get().peerTracks[peerIP]?.audio
            },

            getPeerVideoTracks: (peerIP) => {
                return get().peerTracks[peerIP]?.video
            },

            getPeerAnalyserNode: (peerIP) => {
                return get().peerAnalysers[peerIP]
            },

            getPeerGainNode: (peerIP, label) => {
                return get().peerGainNodes[peerIP]?.[label]
            },

            setPeerGainValue: (peerIP, label, value) => {
                const gainNode = get().peerGainNodes[peerIP]?.[label];
                if (gainNode) {
                    gainNode.gain.value = value;
                }
            },

            resumeAudioContext: async () => {
                if (audioContext.state === 'suspended') {
                    console.log('[mediaStore] Resuming AudioContext');
                    await audioContext.resume();
                }
            },

            getAudioContext: () => audioContext,
        }
    })
)