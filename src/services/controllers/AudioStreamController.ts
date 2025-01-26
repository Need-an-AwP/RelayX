
import { useChannel, useCurrentUser, useMediaStream, useAudioProcessing, useCurrentChannel } from "@/stores";
import type { User } from "@/types";
import RTCService from "../RTCService";


class AudioStreamController {
    private static instance: AudioStreamController | null = null;
    private audioElements: Map<string, HTMLAudioElement> = new Map();

    constructor() {
        useChannel.subscribe(
            state => state.users,
            this.handleChannelUsersChange
        );
    }

    private handleChannelUsersChange = () => {

        const currentChannel = useCurrentUser.getState().inVoiceChannel;
        if (!currentChannel) {
            this.cleanupAllAudio();
            return;
        }
        // filter users in this channel
        // const channelID = currentChannel.id;
        // const channelUsers = users[channelID] || [];
        // const selfIPv4 = useTailscale.getState().selfIPs.ipv4;
        // const remoteUsers = channelUsers.filter(user => user.IPs.ipv4 !== selfIPv4);
        const remoteUsers = useCurrentChannel.getState().remoteUsers;
        
        const receivedStreams = useMediaStream.getState().receivedAudioStream;
        remoteUsers.forEach(user => {
            const userStream = receivedStreams[user.IPs.ipv4!];
            if (userStream) {
                this.playAudioStream(user.IPs.ipv4!, userStream);
            }
        });

        // 清理不在当前频道的用户的音频元素
        this.cleanupUnusedAudio(remoteUsers.map(user => user.IPs.ipv4!));

        // replace audio track in this rtc connection
        this.replaceAudioTracks(remoteUsers);
    }

    private async replaceAudioTracks(remoteUsers: User[]) {
        const finalStream = useAudioProcessing.getState().localFinalStream;
        if (!finalStream) {
            console.error('Final stream not available');
            return;
        }

        const rtcService = RTCService.getInstance();
        for (const user of remoteUsers) {
            const rtcConnection = rtcService.RTCs.get(user.IPs.ipv4!);
            if (rtcConnection) {
                await rtcConnection.replaceAudioTrack(finalStream);
            }
        }
    }

    private playAudioStream(userIP: string, stream: MediaStream) {
        let audioEl = this.audioElements.get(userIP);

        if (!audioEl) {
            // 创建新的音频元素
            audioEl = new Audio();
            audioEl.autoplay = true;
            this.audioElements.set(userIP, audioEl);
        }

        // 如果流发生变化，更新流
        if (audioEl.srcObject !== stream) {
            audioEl.srcObject = stream;
            audioEl.play().catch(err => {
                console.error('Error playing audio stream:', err);
            });
        }
    }

    private cleanupUnusedAudio(activeUserIPs: string[]) {
        // 清理不在活跃用户列表中的音频元素
        for (const [userIP, audioEl] of this.audioElements.entries()) {
            if (!activeUserIPs.includes(userIP)) {
                audioEl.srcObject = null;
                audioEl.remove();
                this.audioElements.delete(userIP);
            }
        }
    }

    private cleanupAllAudio() {
        this.audioElements.forEach((audioEl, userIP) => {
            audioEl.srcObject = null;
            audioEl.remove();
        });
        this.audioElements.clear();
    }

    public setUserVolume(userIP: string, volume: number) {
        const audioEl = this.audioElements.get(userIP);
        if (audioEl) {
            const normalizedVolume = Math.max(0, Math.min(1, volume));
            audioEl.volume = normalizedVolume;
        }
    }

    public getUserVolume(userIP: string): number {
        const audioEl = this.audioElements.get(userIP);
        return audioEl?.volume || 1;
    }

    public static getInstance(): AudioStreamController {
        if (!AudioStreamController.instance) {
            AudioStreamController.instance = new AudioStreamController();
        }
        return AudioStreamController.instance;
    }

    public cleanup() {
        this.cleanupAllAudio();
        AudioStreamController.instance = null;
    }
}

export default AudioStreamController;