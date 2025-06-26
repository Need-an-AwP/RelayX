import { create } from "zustand";
import type { peerIP } from "@/stores";
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
    peerTracks: {
        [peerIP: peerIP]: Partial<TypedTracks>
    }
    trackAudioNodes: Map<peerIP, Map<TransceiverLabel, TrackAudioNodes>>
    peerAnalysers: Map<peerIP, AnalyserNode>
    outputGainNode: GainNode

    addTrack: (peerIP: peerIP, type: TrackType, label: TransceiverLabel, track: MediaStreamTrack) => void
    removeTrack: (peerIP: peerIP, type: TrackType, label: TransceiverLabel) => void
    removePeerTracks: (peerIP: peerIP) => void
    getPeerTracks: (peerIP: peerIP) => Partial<TypedTracks> | undefined
    getPeerAudioTracks: (peerIP: peerIP) => LabeledTracks | undefined
    getPeerVideoTracks: (peerIP: peerIP) => LabeledTracks | undefined
    getPeerAnalyserNode: (peerIP: peerIP) => AnalyserNode | undefined
    resumeAudioContext: () => Promise<void>
    getAudioContext: () => AudioContext
    setOutputGainValue: (value: number) => void
}


export const useMediaStore = create<useMediaStore>((set, get) => {
    const audioContext = new AudioContext();
    console.log(`[mediaStore] Created global AudioContext. State: ${audioContext.state}`);
    const destinationNode = audioContext.createMediaStreamDestination();
    const outputGainNode = audioContext.createGain();
    outputGainNode.connect(destinationNode)

    return {
        mixedAudioStream: destinationNode.stream,
        peerTracks: {},
        trackAudioNodes: new Map(),
        peerAnalysers: new Map(),
        outputGainNode: outputGainNode,

        addTrack: (peerIP, type, label, track) => {
            set((state) => {
                const newPeerTracks = {
                    ...state.peerTracks,
                    [peerIP]: {
                        ...state.peerTracks[peerIP],
                        [type]: {
                            ...(state.peerTracks[peerIP]?.[type] || {}),
                            [label]: track,
                        },
                    },
                }

                if (type === 'video') {
                    return { peerTracks: newPeerTracks }
                }

                const newTrackAudioNodes = new Map(state.trackAudioNodes)
                if (!newTrackAudioNodes.has(peerIP)) {
                    newTrackAudioNodes.set(peerIP, new Map())
                }
                const peerAudioNodes = newTrackAudioNodes.get(peerIP)!

                const newPeerAnalysers = new Map(state.peerAnalysers)
                let peerAnalyser = newPeerAnalysers.get(peerIP)
                if (!peerAnalyser) {
                    peerAnalyser = audioContext.createAnalyser()
                    newPeerAnalysers.set(peerIP, peerAnalyser)
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
                gainNode.connect(peerAnalyser)

                peerAudioNodes.set(label, { sourceNode, gainNode })

                return {
                    peerTracks: newPeerTracks,
                    trackAudioNodes: newTrackAudioNodes,
                    peerAnalysers: newPeerAnalysers,
                }
            })
        },

        removeTrack: (peerIP, type, label) => {
            set((state) => {
                const allPeerTracks = { ...state.peerTracks }
                const peerData = allPeerTracks[peerIP]

                if (!peerData?.[type]?.[label]) {
                    return state // No change, track doesn't exist
                }

                const newPeerData = { ...peerData }
                const newTypeTracks = { ...newPeerData[type] }
                delete newTypeTracks[label]
                newPeerData[type] = newTypeTracks

                if (Object.keys(newTypeTracks).length === 0) {
                    delete newPeerData[type]
                }

                if (Object.keys(newPeerData).length === 0) {
                    delete allPeerTracks[peerIP]
                } else {
                    allPeerTracks[peerIP] = newPeerData
                }

                if (type === 'video') {
                    return { peerTracks: allPeerTracks }
                }

                const newTrackAudioNodes = new Map(state.trackAudioNodes)
                const peerAudioNodes = newTrackAudioNodes.get(peerIP)
                const trackNodes = peerAudioNodes?.get(label)

                if (trackNodes && peerAudioNodes) {
                    trackNodes.gainNode.disconnect()
                    trackNodes.sourceNode.disconnect()
                    peerAudioNodes.delete(label)

                    if (peerAudioNodes.size === 0) {
                        newTrackAudioNodes.delete(peerIP)

                        const newPeerAnalysers = new Map(state.peerAnalysers)
                        const peerAnalyser = newPeerAnalysers.get(peerIP)
                        if (peerAnalyser) {
                            peerAnalyser.disconnect()
                            newPeerAnalysers.delete(peerIP)
                        }

                        return {
                            peerTracks: allPeerTracks,
                            trackAudioNodes: newTrackAudioNodes,
                            peerAnalysers: newPeerAnalysers,
                        }
                    }
                }

                return {
                    peerTracks: allPeerTracks,
                    trackAudioNodes: newTrackAudioNodes,
                }
            })
        },

        removePeerTracks: (peerIP) => {
            set((state) => {
                const newPeerTracks = { ...state.peerTracks }
                delete newPeerTracks[peerIP]

                const newTrackAudioNodes = new Map(state.trackAudioNodes)
                const peerAudioNodes = newTrackAudioNodes.get(peerIP)

                if (peerAudioNodes) {
                    for (const { sourceNode, gainNode } of peerAudioNodes.values()) {
                        gainNode.disconnect()
                        sourceNode.disconnect()
                    }
                    newTrackAudioNodes.delete(peerIP)
                }

                const newPeerAnalysers = new Map(state.peerAnalysers)
                const peerAnalyser = newPeerAnalysers.get(peerIP)
                if (peerAnalyser) {
                    peerAnalyser.disconnect()
                    newPeerAnalysers.delete(peerIP)
                }

                return {
                    peerTracks: newPeerTracks,
                    trackAudioNodes: newTrackAudioNodes,
                    peerAnalysers: newPeerAnalysers,
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
            return get().peerAnalysers.get(peerIP)
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