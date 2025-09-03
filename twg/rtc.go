package main

import (
	"bytes"
	// "crypto/rand"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	// "github.com/pion/rtcp"
	"github.com/pion/rtp/codecs"
	"github.com/pion/webrtc/v4"
	"log"
	"maps"
	"net"
	"net/http"
	"sync"
	"time"
)

type RTCRole string

const (
	OFFER  RTCRole = "offer"
	ANSWER RTCRole = "answer"
)

type RTCConnection struct {
	pc                *webrtc.PeerConnection
	peerIP            string
	role              RTCRole
	dc                *webrtc.DataChannel
	pdc               *webrtc.DataChannel
	candidatesMu      sync.RWMutex
	pendingCandidates []*webrtc.ICECandidate
	videoTrack        *webrtc.TrackLocalStaticSample
	videoSender       *webrtc.RTPSender
	CreatedAt         time.Time
	mu                sync.RWMutex
	lastPingTime      time.Time
	latency           time.Duration
	pingMu            sync.RWMutex
}

// rm
type RTCManager struct {
	connections map[string]*RTCConnection // key is peer IP
	api         *webrtc.API
	client      *http.Client
	mu          sync.RWMutex
}

type SDPWithICE struct {
	SDP     webrtc.SessionDescription `json:"sdp"`
	ICEList []*webrtc.ICECandidate    `json:"iceList"`
}

type HTTPpayload struct {
	From       string     `json:"from"`
	Role       RTCRole    `json:"role"`
	SDPWithICE SDPWithICE `json:"sdpWithICE"`
}

func (rm *RTCManager) sendViaTS(
	role RTCRole,
	targetIP string,
	sdp webrtc.SessionDescription,
	iceList []*webrtc.ICECandidate,
) {
	payload := HTTPpayload{
		From: nodeInfo.TailscaleIP,
		Role: role,
		SDPWithICE: SDPWithICE{
			SDP:     sdp,
			ICEList: iceList,
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[RTC] Failed to marshal JSON: %v", err)
		return
	}

	endpoint := "offer_ice"
	if role == ANSWER {
		endpoint = "answer_ice"
	}
	url := fmt.Sprintf("http://%s:%s/%s", targetIP, tcpPort, endpoint)
	// log.Printf("[RTC] URL: %s, Payload: %s", url, string(jsonData))

	resp, err := rm.client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("[RTC] Failed to send HTTP request to %s: %v", targetIP, err)
		return
	}
	defer resp.Body.Close()

	// log.Printf("[RTC] HTTP response status: %s", resp.Status)
}

func initWebRTC(conn net.PacketConn, httpClient *http.Client) {
	settingEngine := webrtc.SettingEngine{}
	settingEngine.SetNetworkTypes([]webrtc.NetworkType{webrtc.NetworkTypeUDP4}) // only use tailscale's conn
	settingEngine.SetICEUDPMux(webrtc.NewICEUDPMux(nil, conn))                  // only collect udp4 ice

	api := webrtc.NewAPI(webrtc.WithSettingEngine(settingEngine))

	rtcManager = &RTCManager{
		connections: make(map[string]*RTCConnection),
		api:         api,
		client:      httpClient,
	}

	go rtcManager.managePeerConnections()

	log.Println("[RTC] WebRTC manager initialized")
}

func (rm *RTCManager) managePeerConnections() {
	ticker := time.NewTicker(broadcastInterval)
	defer ticker.Stop()
	pingTicker := time.NewTicker(3 * time.Second)
	defer pingTicker.Stop()

	for {
		select {
		case <-ticker.C:
			rm.createRTCtoOnlinePeers()
			// rm.cleanupStaleConnections()
		case <-pingTicker.C:
			rm.sendPingsByPdc()
		}
	}
}

func (rm *RTCManager) createRTCtoOnlinePeers() {
	onlinePeersMu.RLock()
	currentPeers := make(map[string]OnlinePeerData)
	maps.Copy(currentPeers, onlinePeers)
	onlinePeersMu.RUnlock()

	rm.mu.Lock()
	defer rm.mu.Unlock()

	for peerIP, peerData := range currentPeers {
		// 跳过自己
		if peerIP == nodeInfo.TailscaleIP {
			continue
		}

		if _, exists := rm.connections[peerIP]; !exists {
			// 使用较晚启动或随机ID较大的节点发起连接，避免双向连接
			shouldCreateConnection := nodeInfo.StartTime > peerData.NodeInfo.StartTime ||
				(nodeInfo.StartTime == peerData.NodeInfo.StartTime && nodeInfo.RandomID > peerData.NodeInfo.RandomID)

			if shouldCreateConnection {
				go rm.createConnection(OFFER, peerIP, nil)
			}
			// createConnection will be called when receiving sdp on answer side
		}
	}

	// remove offline peer's connection
	for peerIP, connection := range rm.connections {
		if _, exists := currentPeers[peerIP]; !exists {
			rm.closeConnection(peerIP, connection)
		}
	}
}

func (rm *RTCManager) createConnection(role RTCRole, peerIP string, sdpWithIce *SDPWithICE) {
	log.Printf("[RTC] Creating %s connection to peer %s", role, peerIP)

	pc, err := rm.api.NewPeerConnection(webrtc.Configuration{})
	if err != nil {
		log.Printf("[RTC] Failed to create peer connection for %s: %v", peerIP, err)
		return
	}

	var dc *webrtc.DataChannel
	var pdc *webrtc.DataChannel
	if role == OFFER {
		dc, err = pc.CreateDataChannel("data", nil)
		if err != nil {
			log.Printf("[RTC] Failed to create data channel for %s: %v", peerIP, err)
			pc.Close()
			return
		}
		rm.setupDataChannelHandlers(dc)

		pdc, err := pc.CreateDataChannel("ping", nil)
		if err != nil {
			log.Printf("[RTC] Failed to create ping data channel for %s: %v", peerIP, err)
			pc.Close()
			return
		}
		rm.setupPingDataChannel(pdc, peerIP)
	}

	connection := &RTCConnection{
		pc:                pc,
		peerIP:            peerIP,
		role:              role,
		dc:                dc, // nil at answer side
		pdc:               pdc,
		pendingCandidates: make([]*webrtc.ICECandidate, 0),
		CreatedAt:         time.Now(),
	}

	// 设置事件处理器
	// rm.setupConnectionHandlers(connection)

	rm.mu.Lock()
	rm.connections[peerIP] = connection
	defer rm.mu.Unlock()

	rm.addTracks(pc, connection)

	rm.setupPcHandlers(pc, connection)

	var sdp webrtc.SessionDescription
	switch role {
	case OFFER:

		// rm.addTransceivers(pc, connection)

		sdp, err = pc.CreateOffer(nil)
		if err != nil {
			log.Printf("[RTC] Failed to create offer for %s: %v", peerIP, err)
			rm.closeConnection(peerIP, connection)
			return
		}

	case ANSWER:
		if sdpWithIce == nil {
			log.Printf("[RTC] Error: remoteOffer is nil for answer role")
			rm.closeConnection(peerIP, connection)
			return
		}

		if err := pc.SetRemoteDescription(sdpWithIce.SDP); err != nil {
			log.Printf("[RTC] Error setting remote description for %s: %v", peerIP, err)
			rm.closeConnection(peerIP, connection)
			return
		}

		sdp, err = pc.CreateAnswer(nil)
		if err != nil {
			log.Printf("[RTC] Failed to create answer for %s: %v", peerIP, err)
			rm.closeConnection(peerIP, connection)
			return
		}

		if err := addICE(connection.pc, sdpWithIce.ICEList); err != nil {
			log.Printf("[RTC] Error adding ICE candidates for %s: %v", peerIP, err)
			rm.closeConnection(peerIP, connection)
			return
		}
	}

	// ⭐
	gatherComplete := webrtc.GatheringCompletePromise(pc)
	if err = pc.SetLocalDescription(sdp); err != nil {
		log.Panicf("[RTC] Failed to set local description for %s: %v", peerIP, err)
	}
	<-gatherComplete
	// fmt.Println("ICE Gathering is officially complete (via GatheringCompletePromise).")

	rm.sendViaTS(role, peerIP, sdp, connection.pendingCandidates)
}

func (rm *RTCManager) HandleAnswer(peerIP string, sdpWithIce *SDPWithICE) error {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	connection, exists := rm.connections[peerIP]
	if !exists {
		return fmt.Errorf("[RTC] receiving answer from %s but connection not found", peerIP)
	}

	connection.mu.Lock()
	defer connection.mu.Unlock()

	if connection.role != OFFER {
		return fmt.Errorf("[RTC] receiving answer from %s but self role is not offer", peerIP)
	}

	if err := connection.pc.SetRemoteDescription(sdpWithIce.SDP); err != nil {
		rm.closeConnection(peerIP, connection)
		return fmt.Errorf("[RTC] Error setting remote description for %s: %v", peerIP, err)
	}

	if err := addICE(connection.pc, sdpWithIce.ICEList); err != nil {
		rm.closeConnection(peerIP, connection)
		return fmt.Errorf("[RTC] Error adding ICE candidates for %s: %v", peerIP, err)
	}

	return nil
}

func addICE(pc *webrtc.PeerConnection, candidates []*webrtc.ICECandidate) error {
	for _, candidate := range candidates {
		candidateInit := webrtc.ICECandidateInit{
			Candidate:     candidate.ToJSON().Candidate,
			SDPMid:        candidate.ToJSON().SDPMid,
			SDPMLineIndex: candidate.ToJSON().SDPMLineIndex,
		}
		if err := pc.AddICECandidate(candidateInit); err != nil {
			return err
		}
	}
	return nil
}

func (rm *RTCManager) closeConnection(peerIP string, connection *RTCConnection) {
	// caller must have rm.mu.Lock()
	if err := connection.pc.Close(); err != nil {
		log.Printf("[RTC] Error closing connection to %s: %v", peerIP, err)
	}
	delete(rm.connections, peerIP)
}

func (rm *RTCManager) setupPcHandlers(pc *webrtc.PeerConnection, connection *RTCConnection) {
	pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		log.Printf("[RTC onTrack] received track: streamID:%s, ID:%s", track.StreamID(), track.ID())

		handleTrack(track)
	})

	pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}

		log.Printf("[RTC] Candidate collected: %v", candidate)

		connection.candidatesMu.Lock()
		defer connection.candidatesMu.Unlock()
		connection.pendingCandidates = append(connection.pendingCandidates, candidate)
	})

	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		stateData := struct {
			Type  string `json:"type"`
			State string `json:"state"`
			Peer  string `json:"peerIP"`
		}{
			Type:  "connection_state",
			State: state.String(),
			Peer:  connection.peerIP,
		}
		jsonData, _ := json.Marshal(stateData)
		fmt.Println(string(jsonData))

		// if state == webrtc.PeerConnectionStateConnected {
		// 	for _, transceiver := range pc.GetTransceivers() {
		// 		log.Printf("[RTC on %s] Transceiver mid=%s, direction=%s, kind=%v",
		// 			connection.role,
		// 			transceiver.Mid(),
		// 			transceiver.Direction(),
		// 			transceiver.Kind())
		// 	}
		// }
	})

	// for answer side only
	pc.OnDataChannel(func(dc *webrtc.DataChannel) {
		connection.mu.Lock()
		connection.dc = dc
		connection.mu.Unlock()

		if dc.Label() == "ping" {
			rm.setupPingDataChannel(dc, connection.peerIP)
		} else if dc.Label() == "data" {
			rm.setupDataChannelHandlers(dc)
		}

	})
}

func (rm *RTCManager) setupDataChannelHandlers(dc *webrtc.DataChannel) {
	dc.OnOpen(func() {
		log.Printf("[RTC datachannel] Data channel %v opened", dc.Label())
	})

	dc.OnClose(func() {
		log.Printf("[RTC datachannel] Data channel %v closed", dc.Label())
	})

	dc.OnMessage(func(msg webrtc.DataChannelMessage) {
		log.Printf("[RTC datachannel] Message received on data channel %v: %s", dc.Label(), msg.Data)
		if msg.IsString {
			fmt.Printf("%s\n", msg.Data)
		}
	})
}


func (rm *RTCManager) addTracks(pc *webrtc.PeerConnection, connection *RTCConnection) error {
	videoTrack, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{MimeType: "video/vp8"},
		"camera-video",
		"camera",
	)
	if err != nil {
		log.Printf("[RTC] Failed to create video track: %v", err)
		return err
	}

	videoSender, err := pc.AddTrack(videoTrack)
	if err != nil {
		log.Printf("[RTC] Failed to add video track: %v", err)
		return err
	}
	connection.videoTrack = videoTrack
	connection.videoSender = videoSender

	////////////////
	go func() {
		rtcpBuf := make([]byte, 1500)
		for {
			n, _, rtcpErr := videoSender.Read(rtcpBuf)
			if rtcpErr != nil {
				return
			}
			_ = n

			// // Parse the RTCP packet
			// packets, err := rtcp.Unmarshal(rtcpBuf[:n])
			// if err != nil {
			// 	log.Printf("[RTCP] Failed to unmarshal RTCP packet: %v", err)
			// 	continue
			// }

			// // Process each RTCP packet
			// for _, packet := range packets {
			// 	switch p := packet.(type) {
			// 	case *rtcp.ReceiverReport:
			// 		log.Printf("[RTCP] Receiver Report from SSRC %d with %d reports",
			// 			p.SSRC, len(p.Reports))
			// 		for _, report := range p.Reports {
			// 			log.Printf("[RTCP] Report: SSRC=%d, Fraction Lost=%d, Total Lost=%d, Jitter=%d, Delay=%d",
			// 				report.SSRC, report.FractionLost, report.TotalLost, report.Jitter, report.Delay)
			// 		}
			// 	case *rtcp.SenderReport:
			// 		log.Printf("[RTCP] Sender Report from SSRC %d, NTP %v, RTP %d, Packet Count %d, Octet Count %d",
			// 			p.SSRC, p.NTPTime, p.RTPTime, p.PacketCount, p.OctetCount)
			// 	case *rtcp.ExtendedReport:
			// 		log.Printf("[RTCP] Extended Report from SSRC %d with %d report blocks",
			// 			p.SenderSSRC, len(p.Reports))
			// 	case *rtcp.TransportLayerNack:
			// 		log.Printf("[RTCP] NACK from SSRC %d, Media SSRC %d with %d lost packets",
			// 			p.SenderSSRC, p.MediaSSRC, len(p.Nacks))
			// 	}
			// }
		}
	}()

	return nil
}

func handleTrack(track *webrtc.TrackRemote) {
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

			// 检查是否是新帧的开始
			if rtpPacket.Timestamp != lastTimestamp && len(frameBuffer) > 0 {
				// 发送完整的前一帧
				if wsConn != nil {
					// log.Printf("Sending complete frame: %d bytes", len(frameBuffer))
					wsConn.WriteMessage(websocket.BinaryMessage, frameBuffer)
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
}

// not using transceivers to presave track
