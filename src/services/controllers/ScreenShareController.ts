import { useScreenShare, useCurrentChannel, useCurrentUser, useBlankStreams } from "@/stores";
import type { User } from "@/types";
import RTCService from "../RTCService";

class ScreenShareController {
    private static instance: ScreenShareController | null = null;

    constructor() {
        // 监听屏幕共享状态变化
        useCurrentUser.subscribe(
            state => state.isScreenSharing,
            this.handleScreenShareStreamChange
        );
    }

    private handleScreenShareStreamChange = async (isScreenSharing: boolean) => {
        // filter users in this channel
        // const currentChannel = useCurrentUser.getState().inVoiceChannel;
        // if (!currentChannel) return;
        // const channelUsers = useChannel.getState().users[currentChannel.id] || [];
        // const selfIPv4 = useTailscale.getState().selfIPs.ipv4;
        // const remoteUsers = channelUsers.filter(user => user.IPs.ipv4 !== selfIPv4);
        const remoteUsers = useCurrentChannel.getState().remoteUsers;
        const stream = useScreenShare.getState().stream;
        if (isScreenSharing && stream) {
            await this.replaceVideoTracks(stream, remoteUsers);
        } else if (!isScreenSharing) {
            const blankVideoStream = useBlankStreams.getState().blankVideoStream;
            if (blankVideoStream) {
                await this.replaceVideoTracks(blankVideoStream, remoteUsers);
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            window.ipcBridge.send('capture_id', null);
        }
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