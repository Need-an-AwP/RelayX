import { create } from 'zustand';
import type { TrackIDType } from '@/types';

export interface VideoStream {
    peerIP: string;
    trackID: TrackIDType;
    track: MediaStreamTrack;
    stream: MediaStream;
}

interface VideoStreamState {
    // 以 peerIP 为键，存储该用户的所有视频流
    streamsByPeer: Record<string, VideoStream[]>;
    // 提供一个扁平化的列表，方便 UI 直接渲染
    allStreams: VideoStream[];
}

interface VideoStreamActions {
    addVideoStream: (peerIP: string, trackID: TrackIDType, track: MediaStreamTrack) => void;
    removeVideoStream: (peerIP: string, trackID: TrackIDType) => void;
    removePeerStreams: (peerIP: string) => void;
    getStreamsByPeer: (peerIP: string) => VideoStream[];
}

type VideoStreamStore = VideoStreamState & VideoStreamActions;

const useVideoStreamStore = create<VideoStreamStore>((set, get) => ({
    streamsByPeer: {},
    allStreams: [],

    addVideoStream: (peerIP, trackID, track) => {
        const { streamsByPeer } = get();
        const newStream: VideoStream = {
            peerIP,
            trackID,
            track,
            stream: new MediaStream([track]),
        };

        const peerStreams = streamsByPeer[peerIP] ? [...streamsByPeer[peerIP]] : [];
        
        // 避免重复添加
        const existingStreamIndex = peerStreams.findIndex(s => s.trackID === trackID);
        if (existingStreamIndex !== -1) {
            peerStreams[existingStreamIndex] = newStream;
        } else {
            peerStreams.push(newStream);
        }

        const newStreamsByPeer = { ...streamsByPeer, [peerIP]: peerStreams };

        set({
            streamsByPeer: newStreamsByPeer,
            allStreams: Object.values(newStreamsByPeer).flat(),
        });

        console.log(`[VideoStreamStore] Added/Updated video stream for ${peerIP}-${trackID}`, {
            track,
            stream: newStream.stream,
            trackEnabled: track.enabled,
            trackMuted: track.muted,
            trackReadyState: track.readyState,
            streamActive: newStream.stream.active,
            streamTracks: newStream.stream.getTracks()
        });
    },

    removeVideoStream: (peerIP, trackID) => {
        const { streamsByPeer } = get();
        const peerStreams = streamsByPeer[peerIP];

        if (!peerStreams) return;

        const updatedPeerStreams = peerStreams.filter(s => s.trackID !== trackID);

        const newStreamsByPeer = { ...streamsByPeer };
        if (updatedPeerStreams.length > 0) {
            newStreamsByPeer[peerIP] = updatedPeerStreams;
        } else {
            delete newStreamsByPeer[peerIP];
        }

        set({
            streamsByPeer: newStreamsByPeer,
            allStreams: Object.values(newStreamsByPeer).flat(),
        });
        console.log(`[VideoStreamStore] Removed video stream for ${peerIP}-${trackID}`);
    },

    removePeerStreams: (peerIP: string) => {
        const { streamsByPeer } = get();
        if (!streamsByPeer[peerIP]) return;

        const newStreamsByPeer = { ...streamsByPeer };
        delete newStreamsByPeer[peerIP];

        set({
            streamsByPeer: newStreamsByPeer,
            allStreams: Object.values(newStreamsByPeer).flat(),
        });
        console.log(`[VideoStreamStore] Removed all streams for peer ${peerIP}`);
    },

    getStreamsByPeer: (peerIP: string) => {
        return get().streamsByPeer[peerIP] || [];
    },
}));

export { useVideoStreamStore };
