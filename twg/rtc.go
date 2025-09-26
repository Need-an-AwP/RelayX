package main

import (
	"bytes"
	"encoding/json"
	"fmt"

	"log"
	"maps"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/pion/interceptor"
	"github.com/pion/interceptor/pkg/cc"
	"github.com/pion/interceptor/pkg/gcc"
	"github.com/pion/webrtc/v4"
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
	tracks            map[uint8]*webrtc.TrackLocalStaticSample // key is track.ID
	isInChat          bool
	senders           map[uint8]*webrtc.RTPSender // key is track.ID
	videoRTCtrack     *webrtc.TrackLocalStaticRTP
	CreatedAt         time.Time
	mu                sync.RWMutex
	lastPingTime      time.Time
	latency           time.Duration
	pingMu            sync.RWMutex
}

// rm
type RTCManager struct {
	connections       map[string]*RTCConnection // key is peer IP
	estimators        map[string]cc.BandwidthEstimator
	estimatorsMu      sync.RWMutex
	api               *webrtc.API
	client            *http.Client
	localPC           *webrtc.PeerConnection
	mu                sync.RWMutex
	pendingEstimators []cc.BandwidthEstimator // 待分配的估计器队列
	estimatorQueue    sync.Mutex
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

func (rm *RTCManager) assignEstimatorToPeer(peerIP string) {
	rm.estimatorQueue.Lock()
	defer rm.estimatorQueue.Unlock()

	if len(rm.pendingEstimators) > 0 {
		// FIFO: 分配第一个可用的估计器
		estimator := rm.pendingEstimators[0]
		rm.pendingEstimators = rm.pendingEstimators[1:]

		rm.estimatorsMu.Lock()
		rm.estimators[peerIP] = estimator
		rm.estimatorsMu.Unlock()

		log.Printf("[RTC] Assigned bandwidth estimator to peer %s", peerIP)
	}
}

func initWebRTC(conn net.PacketConn, httpClient *http.Client) {
	// setup BandwidthEstimator
	var initBitrate int = 600_000
	var maxBitrate int = 50_000_000
	var minBitrate int = 100_000 // 100kbps
	interceptorRegistry := &interceptor.Registry{}
	mediaEngine := &webrtc.MediaEngine{}
	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		panic(err)
	}
	congestionController, err := cc.NewInterceptor(func() (cc.BandwidthEstimator, error) {
		return gcc.NewSendSideBWE(
			gcc.SendSideBWEInitialBitrate(initBitrate),
			gcc.SendSideBWEMaxBitrate(maxBitrate),
			gcc.SendSideBWEMinBitrate(minBitrate),
		)
	})
	if err != nil {
		panic(err)
	}
	congestionController.OnNewPeerConnection(func(id string, estimator cc.BandwidthEstimator) {
		if rtcManager != nil {
			rtcManager.estimatorQueue.Lock()
			rtcManager.pendingEstimators = append(rtcManager.pendingEstimators, estimator)
			rtcManager.estimatorQueue.Unlock()
		}
	})
	interceptorRegistry.Add(congestionController)
	if err = webrtc.ConfigureTWCCHeaderExtensionSender(mediaEngine, interceptorRegistry); err != nil {
		panic(err)
	}
	if err = webrtc.RegisterDefaultInterceptors(mediaEngine, interceptorRegistry); err != nil {
		panic(err)
	}

	// setup settingengine
	settingEngine := webrtc.SettingEngine{}
	settingEngine.SetNetworkTypes([]webrtc.NetworkType{webrtc.NetworkTypeUDP4}) // only collect udp4 ice
	settingEngine.SetICEUDPMux(webrtc.NewICEUDPMux(nil, conn))                  // only use tailscale's conn

	api := webrtc.NewAPI(
		webrtc.WithSettingEngine(settingEngine),
		webrtc.WithMediaEngine(mediaEngine),
		webrtc.WithInterceptorRegistry(interceptorRegistry),
	)

	rtcManager = &RTCManager{
		connections:       make(map[string]*RTCConnection),
		estimators:        make(map[string]cc.BandwidthEstimator),
		pendingEstimators: make([]cc.BandwidthEstimator, 0),
		api:               api,
		client:            httpClient,
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
			go rm.reportBandwidthEstimates()
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

	rm.assignEstimatorToPeer(peerIP)

	var dc *webrtc.DataChannel
	var pdc *webrtc.DataChannel
	if role == OFFER {
		dc, err = pc.CreateDataChannel("data", nil)
		if err != nil {
			log.Printf("[RTC] Failed to create data channel for %s: %v", peerIP, err)
			pc.Close()
			return
		}
		rm.setupDataChannelHandlers(dc, peerIP)

		pdc, err = pc.CreateDataChannel("ping", nil)
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
		tracks:            make(map[uint8]*webrtc.TrackLocalStaticSample),
		isInChat:          false,
		senders:           make(map[uint8]*webrtc.RTPSender),
		CreatedAt:         time.Now(),
	}

	// 设置事件处理器
	// rm.setupConnectionHandlers(connection)

	rm.mu.Lock()
	defer rm.mu.Unlock()

	rm.addTracks(pc, connection)

	rm.setupPcHandlers(pc, connection)

	var sdp webrtc.SessionDescription
	switch role {
	case OFFER:
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

	// Store the connection
	rm.connections[peerIP] = connection

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

		go handleRTCP("receiver:"+track.ID(), receiver)
		handleTrack(track, connection.peerIP)
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
		sendMsgWs(jsonData)

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
		if connection.role == OFFER {
			return
		}

		connection.mu.Lock()
		// Assign to correct field based on label
		if dc.Label() == "ping" {
			connection.pdc = dc
			rm.setupPingDataChannel(dc, connection.peerIP)
		} else if dc.Label() == "data" {
			connection.dc = dc
			rm.setupDataChannelHandlers(dc, connection.peerIP)
		}
		connection.mu.Unlock()
	})
}
