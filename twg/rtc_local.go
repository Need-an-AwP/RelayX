package main

import (
	"encoding/json"
	"log"

	"github.com/pion/webrtc/v4"
)

func (rm *RTCManager) createLocalRTC(offerData interface{}, iceData interface{}) {
	// local rtc collect all ice candidates
	// cause broswer never collect localhost ice,
	// so the local rtc will fail if no common ice

	// 解析 offer (SessionDescription)
	offerMap, ok := offerData.(map[string]interface{})
	if !ok {
		log.Printf("[localRTC] offer field is not a valid object")
		return
	}

	offerSDP, hasSDP := offerMap["sdp"].(string)
	offerType, hasType := offerMap["type"].(string)
	if !hasSDP || !hasType {
		log.Printf("[localRTC] offer object missing sdp or type field")
		return
	}

	offer := webrtc.SessionDescription{
		Type: webrtc.NewSDPType(offerType),
		SDP:  offerSDP,
	}

	// 解析 ice candidates - 创建一个空切片，稍后通过 AddICECandidate 添加
	iceArray, ok := iceData.([]interface{})
	if !ok {
		log.Printf("[localRTC] ice field is not a valid array")
		return
	}

	// 先存储 ICECandidateInit 对象，稍后使用
	var candidateInits []webrtc.ICECandidateInit
	for _, iceItem := range iceArray {
		iceMap, ok := iceItem.(map[string]interface{})
		if !ok {
			continue
		}

		candidate, hasCandidate := iceMap["candidate"].(string)
		sdpMid, hasMid := iceMap["sdpMid"].(string)
		sdpMLineIndex, hasIndex := iceMap["sdpMLineIndex"].(float64)

		if hasCandidate && hasMid && hasIndex {
			iceCandidate := webrtc.ICECandidateInit{
				Candidate:     candidate,
				SDPMid:        &sdpMid,
				SDPMLineIndex: (*uint16)(func() *uint16 { idx := uint16(sdpMLineIndex); return &idx }()),
			}
			candidateInits = append(candidateInits, iceCandidate)
		}
	}

	log.Printf("[localRTC] Received offer with %d ICE candidates", len(candidateInits))

	mediaEngine := &webrtc.MediaEngine{}
	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		panic(err)
	}
	settingEngine := webrtc.SettingEngine{}
	settingEngine.SetNetworkTypes([]webrtc.NetworkType{webrtc.NetworkTypeUDP4}) // only collect udp4 ice
	api := webrtc.NewAPI(
		webrtc.WithMediaEngine(mediaEngine),
		webrtc.WithSettingEngine(settingEngine),
	)
	pc, err := api.NewPeerConnection(webrtc.Configuration{})
	if err != nil {
		log.Printf("[localRTC] Failed to create peer connection: %v", err)
		return
	}

	///////////// test reflect track
	// create reflect track before create answer
	outputTrack, err := webrtc.NewTrackLocalStaticRTP(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8},
		"video",
		"pion",
	)
	if err != nil {
		panic(err)
	}
	sender, err := pc.AddTrack(outputTrack)
	if err != nil {
		panic(err)
	}
	go func() {
		rtcpBuf := make([]byte, 1500)
		for {
			if _, _, rtcpErr := sender.Read(rtcpBuf); rtcpErr != nil {
				return
			}
		}
	}()
	///////////// test reflect track

	// 设置远程描述
	if err := pc.SetRemoteDescription(offer); err != nil {
		panic(err)
	}

	// 添加 ICE candidates
	for _, candidateInit := range candidateInits {
		if err := pc.AddICECandidate(candidateInit); err != nil {
			log.Printf("[localRTC] Failed to add ICE candidate: %v", err)
		}
	}

	// 创建答案
	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		log.Printf("[localRTC] Failed to create answer: %v", err)
		pc.Close()
		return
	}

	// 设置本地描述
	if err := pc.SetLocalDescription(answer); err != nil {
		log.Printf("[localRTC] Failed to set local description: %v", err)
		pc.Close()
		return
	}

	var pendingCandidates []*webrtc.ICECandidate

	pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}
		if candidate.Typ != webrtc.ICECandidateTypeHost {
			return
		}

		log.Printf("[localRTC] New ICE candidate gathered: %s", candidate.ToJSON().Candidate)

		pendingCandidates = append(pendingCandidates, candidate)
	})

	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("[localRTC] Peer Connection State: %s", state.String())
	})

	pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		log.Printf(
			"[localRTC] Received remote track: \nID=%s, \nSSRC=%d, \nRID=%s, \nPayloadType=%d, \nCodec=%v",
			track.ID(), track.SSRC(), track.RID(), track.PayloadType(), track.Codec(),
		)

		if track.RID() != "h" {
			return
		}
		for {
			rtp, _, readErr := track.ReadRTP()
			if readErr != nil {
				log.Printf("[localRTC] Failed to read RTP from remote track: %v", readErr)
				pc.Close()
				return
			}

			// reflect back
			// test reflect track
			if writeErr := outputTrack.WriteRTP(rtp); writeErr != nil {
				log.Printf("[localRTC] Failed to write RTP to reflect track: %v", writeErr)
				pc.Close()
				return
			}
			// test reflect track

			// forward to remote pc
			// rtcManager.mu.RLock()
			// for _, connection := range rtcManager.connections {
			// 	connection.mu.RLock()
			// 	if connection.isInChat != true {
			// 		connection.mu.RUnlock()
			// 		continue
			// 	}
			// 	if connection.pc.ConnectionState() != webrtc.PeerConnectionStateConnected {
			// 		connection.mu.RUnlock()
			// 		continue
			// 	}

			// 	if writeErr := connection.videoRTCtrack.WriteRTP(rtp); writeErr != nil {
			// 		panic(writeErr)
			// 	}

			// 	connection.mu.RUnlock()
			// }
			// rtcManager.mu.RUnlock()
		}

	})

	gatherComplete := webrtc.GatheringCompletePromise(pc)
	<-gatherComplete

	// Construct the response with answer and ICE candidates
	response := map[string]interface{}{
		"type":   "local_answer",
		"answer": answer,
		"ice":    pendingCandidates,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		log.Printf("[localRTC] Failed to marshal answer response: %v", err)
		pc.Close()
		return
	}

	// Send answer via WebSocket
	if err := sendMsgWs(jsonResponse); err != nil {
		log.Printf("[localRTC] Failed to send answer via WebSocket: %v", err)
		pc.Close()
		return
	}

	log.Printf("[localRTC] Answer sent with %d ICE candidates", len(pendingCandidates))

	rm.mu.Lock()
	rm.localPC = pc
	rm.mu.Unlock()
}
