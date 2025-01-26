import { useScreenShare, useCurrentChannel } from "@/stores";
import type { User } from "@/types";
import RTCService from "../RTCService";

class ScreenShareController {
    private static instance: ScreenShareController | null = null;

    constructor() {
        // 监听屏幕共享状态变化
        useScreenShare.subscribe(
            state => state.stream,
            this.handleScreenShareStreamChange
        );
    }

    private handleScreenShareStreamChange = async (stream: MediaStream | null) => {
        if (!stream) {
            // 停止所有视频轨道的共享
            return;
        }
        // filter users in this channel
        // const currentChannel = useCurrentUser.getState().inVoiceChannel;
        // if (!currentChannel) return;
        // const channelUsers = useChannel.getState().users[currentChannel.id] || [];
        // const selfIPv4 = useTailscale.getState().selfIPs.ipv4;
        // const remoteUsers = channelUsers.filter(user => user.IPs.ipv4 !== selfIPv4);
        const remoteUsers = useCurrentChannel.getState().remoteUsers;

        // 在所有RTC连接中替换视频轨道
        await this.replaceVideoTracks(stream, remoteUsers);
    }

    private async replaceVideoTracks(stream: MediaStream, remoteUsers: User[]) {
        if (!stream || !remoteUsers) return;

        const rtcService = RTCService.getInstance();
        for (const user of remoteUsers) {
            const rtcConnection = rtcService.RTCs.get(user.IPs.ipv4!);
            if (rtcConnection) {
                await rtcConnection.replaceVideoTrack({ stream, includeAudio: false });
            }
        }
    }

    public static getInstance(): ScreenShareController {
        if (!ScreenShareController.instance) {
            ScreenShareController.instance = new ScreenShareController();
        }
        return ScreenShareController.instance;
    }
}

export default ScreenShareController;