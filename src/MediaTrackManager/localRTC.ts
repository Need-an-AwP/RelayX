import { useWsStore } from "@/stores"

export class LocalRTC {
    public pc: RTCPeerConnection | null = null;
    public transceiver: RTCRtpTransceiver | null = null;
    private static instance: LocalRTC | null = null;
    private pendingCandidates: RTCIceCandidate[] = [];
    // private changeBitrate: NodeJS.Timeout | null = null;

    constructor() {
        this.createlocalRTC();
        // this.changeBitrate = setInterval(() => {
        //     if (this.pc?.connectionState === 'connected' && this.transceiver) {
        //         const sender = this.pc.getSenders()[0];
        //         const params = sender.getParameters();
        //         console.log('[localRTC] Current sender parameters:', params);
        //         if (params.encodings && params.encodings.length > 0) {
        //            const newParams = {...params};
        //            // Find the encoding with rid 'l' and update its maxBitrate
        //            const lEncoding = newParams.encodings.find(e => e.rid === 'l');
        //            if (lEncoding) {
        //              // Toggle between 2,000,000 and 200,000
        //              const currentBitrate = lEncoding.maxBitrate;
        //              const newBitrate = currentBitrate === 2_000_000 ? 200_000 : 2_000_000;
        //              console.log(`[localRTC] Updating maxBitrate for l encoding from ${currentBitrate} to ${newBitrate}`);
        //              lEncoding.maxBitrate = newBitrate;
        //              // Apply the updated parameters
        //              sender.setParameters(newParams)
        //                .then(() => console.log('[localRTC] Parameters updated successfully'))
        //                .catch(err => console.error('[localRTC] Failed to update parameters:', err));
        //            }
        //         }
        //     }
        // }, 10 * 1000);
    }


    public static getInstance(): LocalRTC {
        if (!this.instance) {
            this.instance = new LocalRTC();
        }
        return this.instance;
    }

    private createlocalRTC = async () => {
        const pc = new RTCPeerConnection();

        this.transceiver = pc.addTransceiver('video', {
            direction: 'sendrecv',
            sendEncodings: [
                { rid: 'h', maxBitrate: 2_000_000, maxFramerate: 30, scaleResolutionDownBy: 1.0 },
                { rid: 'm', maxBitrate: 1_000_000, maxFramerate: 25, scaleResolutionDownBy: 1.5 },
                // { rid: 'l', maxBitrate: 500_000, maxFramerate: 15, scaleResolutionDownBy: 2.0 },
            ]
        });

        pc.ontrack = (e) => {
            console.log('[localRTC] Received remote track from pion:', e);

            // useDesktopCapture.getState().setReflectStream(e.streams[0]);
            // Create a video element to display the remote stream
            const videoElement = document.createElement('video');
            videoElement.id = 'remote-video';
            videoElement.autoplay = true;
            videoElement.controls = true;
            videoElement.style.width = '100%';
            videoElement.style.maxHeight = '600px';
            videoElement.srcObject = e.streams[0];

            // Append to document body
            document.body.appendChild(videoElement);
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                if (event.candidate.type !== 'host') {
                    return;
                }
                if (!event.candidate.address?.startsWith('192.168')) {
                    return;
                }
                this.pendingCandidates.push(event.candidate);
            } else if (event.candidate === null) {
                useWsStore.getState().sendMsg({
                    type: 'local_offer',
                    offer: offer,
                    ice: this.pendingCandidates
                });
                console.log('[localRTC] Sent offer with ICE candidates:', this.pendingCandidates);
                this.pendingCandidates = [];
            }
        }

        pc.onconnectionstatechange = () => {
            console.log('[localRTC] Connection state changed:', pc.connectionState);
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('[localRTC] Local description:', offer);


        this.pc = pc;
    }
}