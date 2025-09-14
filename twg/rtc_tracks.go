package main

import (
	"log"
	"strconv"
	"strings"

	"github.com/pion/interceptor"
	// "github.com/pion/rtcp"
	"github.com/pion/rtp/codecs"
	"github.com/pion/webrtc/v4"
)

const (
	MICROPHONE_AUDIO   uint8 = 0
	CPA_AUDIO          uint8 = 1
	SCREEN_SHARE_VIDEO uint8 = 2
)

type trackInfo struct {
	Kind     webrtc.RTPCodecType
	MimeType string
	id       string
	streamID string
}

var trackMap = map[uint8]trackInfo{
	MICROPHONE_AUDIO: {
		Kind:     webrtc.RTPCodecTypeAudio,
		MimeType: webrtc.MimeTypeOpus,
		id:       "microphone-audio",
		streamID: "microphone",
	},
	CPA_AUDIO: {
		Kind:     webrtc.RTPCodecTypeAudio,
		MimeType: webrtc.MimeTypeOpus,
		id:       "cpa-audio",
		streamID: "cpa",
	},
	SCREEN_SHARE_VIDEO: {
		Kind:     webrtc.RTPCodecTypeVideo,
		MimeType: webrtc.MimeTypeVP9,
		id:       "screen-share-video",
		streamID: "screen-share",
	},
}

// ipv4ToBytes 将 IPv4 字符串转换为 4 字节数组
func ipv4ToBytes(ip string) [4]byte {
	var result [4]byte
	parts := strings.Split(ip, ".")
	if len(parts) == 4 {
		for i, part := range parts {
			if val, err := strconv.Atoi(part); err == nil && val >= 0 && val <= 255 {
				result[i] = byte(val)
			}
		}
	}
	return result
}

func (rm *RTCManager) addTracks(pc *webrtc.PeerConnection, connection *RTCConnection) error {

	for _, t := range trackMap {
		track, err := webrtc.NewTrackLocalStaticSample(
			webrtc.RTPCodecCapability{MimeType: t.MimeType},
			t.id,
			t.streamID,
		)
		if err != nil {
			log.Printf("[RTC] Failed to create track: %v", err)
			return err
		}

		sender, err := pc.AddTrack(track)
		if err != nil {
			log.Printf("[RTC] Failed to add track %s: %v", track.ID(), err)
			return err
		}

		connection.tracks[track.ID()] = track
		connection.senders[track.ID()] = sender

		// feedback from rtcp
		go handleRTCP("sender:"+track.ID(), sender)
	}

	return nil
}

func handleTrack(track *webrtc.TrackRemote, peerIP string) {
	var found bool
	for _, info := range trackMap {
		if info.id == track.ID() {
			found = true
			break
		}
	}
	if !found {
		log.Printf("Unknown track ID: %s", track.ID())
		return
	}

	if track.Kind() == webrtc.RTPCodecTypeAudio &&
		track.Codec().MimeType == webrtc.MimeTypeOpus {
		switch track.ID() {
		case trackMap[MICROPHONE_AUDIO].id:
			go depackAudioRTP(track, MICROPHONE_AUDIO, peerIP)
			return
		case trackMap[CPA_AUDIO].id:
			go depackAudioRTP(track, CPA_AUDIO, peerIP)
			return
		default:
			log.Printf("unknown audio track ID: %s", track.ID())
			return
		}
	}

	/*
		if track.Kind() != webrtc.RTPCodecTypeVideo {
			return
		}
		codecName := track.Codec().MimeType
		log.Printf("Track has started, codec: %s", codecName)
		//  if strings.EqualFold(codecName, webrtc.MimeTypeVP8) {
		// 	fmt.Errorf("codec unsupported: %s", codecName)
		//  }

		depacketizer := &codecs.VP8Packet{}
		var frameBuffer []byte
		var lastTimestamp uint32 = 0

		go func() {
			for {
				rtpPacket, _, readErr := track.ReadRTP()
				if readErr != nil {
					log.Printf("RTP read error: %v", readErr)
					return
				}

				// use sendMediaWs to send video data
				// 检查是否是新帧的开始
				if rtpPacket.Timestamp != lastTimestamp && len(frameBuffer) > 0 {
					// 发送完整的前一帧
					ipBytes := ipv4ToBytes(peerIP)
					headerSize := 1 + 4 // 1字节轨道ID + 4字节IP地址
					totalSize := headerSize + len(frameBuffer)
					packet := make([]byte, totalSize)

					offset := 0
					packet[offset] = SCREEN_SHARE_VIDEO // 轨道ID标识
					offset += 1

					// 添加IPv4地址（4字节）
					copy(packet[offset:offset+4], ipBytes[:])
					offset += 4

					copy(packet[offset:], frameBuffer)

					err := sendMediaWs(packet)
					if err != nil {
						log.Printf("Failed to send video frame via WebSocket: %v", err)
					}
					frameBuffer = frameBuffer[:0] // 清空缓冲区
				}
				lastTimestamp = rtpPacket.Timestamp

				// 解包RTP载荷
				frameData, err := depacketizer.Unmarshal(rtpPacket.Payload)
				if err != nil {
					continue
				}

				// 将数据添加到帧缓冲区
				frameBuffer = append(frameBuffer, frameData...)
			}
		}()
	*/
}

func depackAudioRTP(track *webrtc.TrackRemote, trackID uint8, peerIP string) {
	depacketizer := &codecs.OpusPacket{}

	for {
		rtpPacket, _, readErr := track.ReadRTP()
		if readErr != nil {
			log.Printf("Audio RTP read error: %v", readErr)
			return
		}
		// log.Printf("Audio RTP packet received: Timestamp=%d, PayloadSize=%d", rtpPacket.Timestamp, len(rtpPacket.Payload))

		// depack
		opusFrame, err := depacketizer.Unmarshal(rtpPacket.Payload)
		if err != nil {
			log.Printf("Failed to unmarshal Opus packet: %v", err)
			continue
		}

		// create packet with header
		ipBytes := ipv4ToBytes(peerIP)
		headerSize := 1 + 4 // 1字节轨道ID + 4字节IP地址
		totalSize := headerSize + len(opusFrame)
		packet := make([]byte, totalSize)

		offset := 0
		packet[offset] = trackID // 轨道ID标识
		offset += 1

		// 添加IPv4地址（4字节）
		copy(packet[offset:offset+4], ipBytes[:])
		offset += 4

		copy(packet[offset:], opusFrame)

		err = sendMediaWs(packet)
		if err != nil {
			log.Printf("Failed to send audio frame via WebSocket: %v", err)
		}
	}
}

// not using transceivers to presave track

// RTCPReader is an interface that can read RTCP packets
type RTCPReader interface {
	Read([]byte) (int, interceptor.Attributes, error)
}

// handleRTCP processes RTCP packets from either sender or receiver.
// label: a short prefix like "sender:trackID" or "receiver:trackID" to distinguish log source.
func handleRTCP(label string, reader RTCPReader) {
	rtcpBuf := make([]byte, 1500)
	for {
		n, _, rtcpErr := reader.Read(rtcpBuf)
		if rtcpErr != nil {
			log.Printf("[RTCP][%s] reader closed: %v", label, rtcpErr)
			return
		}

		_ = n
		// Parse the RTCP packet
		// packets, err := rtcp.Unmarshal(rtcpBuf[:n])
		// if err != nil {
		// 	log.Printf("[RTCP][%s] Unmarshal error: %v", label, err)
		// 	continue
		// }

		// if label != "sender:microphone-audio"{
		// 	continue
		// }
		// // Process each RTCP packet
		// for _, packet := range packets {
		// 	switch p := packet.(type) {
		// 	case *rtcp.ReceiverReport:
		// 		// log.Printf("[RTCP][%s] RR SSRC=%d reports=%d", label, p.SSRC, len(p.Reports))
		// 		for _, report := range p.Reports {
		// 			log.Printf("[RTCP][%s] RR Report SSRC=%d FractionLost=%d TotalLost=%d Jitter=%d Delay=%d", label,
		// 				report.SSRC, report.FractionLost, report.TotalLost, report.Jitter, report.Delay)
		// 		}
		// 	case *rtcp.SenderReport:
		// 		log.Printf("[RTCP][%s] SR SSRC=%d NTP=%v RTP=%d Packets=%d Octets=%d", label,
		// 			p.SSRC, p.NTPTime, p.RTPTime, p.PacketCount, p.OctetCount)
		// 	case *rtcp.ExtendedReport:// unenabled
		// 		log.Printf("[RTCP][%s] XR SenderSSRC=%d blocks=%d", label, p.SenderSSRC, len(p.Reports))
		// 	case *rtcp.TransportLayerNack:
		// 		log.Printf("[RTCP][%s] NACK SenderSSRC=%d MediaSSRC=%d lost=%d", label, p.SenderSSRC, p.MediaSSRC, len(p.Nacks))
		// 	case *rtcp.PictureLossIndication:
		// 		log.Printf("[RTCP][%s] PLI SenderSSRC=%d MediaSSRC=%d", label, p.SenderSSRC, p.MediaSSRC)
		// 	case *rtcp.FullIntraRequest:
		// 		log.Printf("[RTCP][%s] FIR SSRC=%d FCI=%d", label, p.SenderSSRC, len(p.FIR))
		// 	case *rtcp.SourceDescription:
		// 		log.Printf("[RTCP][%s] SDES chunks=%d", label, len(p.Chunks))
		// 	case *rtcp.Goodbye:
		// 		log.Printf("[RTCP][%s] BYE sources=%v", label, p.Sources)
		// 	case *rtcp.SliceLossIndication:
		// 		log.Printf("[RTCP][%s] SLI SenderSSRC=%d MediaSSRC=%d num=%d", label, p.SenderSSRC, p.MediaSSRC, len(p.SLI))
		// 	case *rtcp.ReceiverEstimatedMaximumBitrate:
		// 		log.Printf("[RTCP][%s] REMB SSRC=%d Bitrate=%f SSRCs=%v", label, p.SenderSSRC, p.Bitrate, p.SSRCs)
		// 	default:
		// 		log.Printf("[RTCP][%s] Unhandled packet type: %T", label, packet)
		// 	}
		// }
	}
}
