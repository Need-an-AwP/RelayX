package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media"
)

var (
	wsConn           *websocket.Conn
	wsConnMu         sync.Mutex
	msgWsConn        *websocket.Conn
	msgWsConnMu      sync.Mutex
	audioBitrateList = []uint32{32000, 64000, 128000}
)

type wsManager struct {
	medConn     *websocket.Conn
	medConnMu   sync.Mutex
	msgWsConn   *websocket.Conn
	msgWsConnMu sync.Mutex
}

// create local websocket server
func initWsService() {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("ws upgrade error: %v", err)
			return
		}
		defer func() {
			conn.Close()
			// 连接关闭时清理全局变量
			wsConnMu.Lock()
			if wsConn == conn {
				wsConn = nil
			}
			wsConnMu.Unlock()
		}()

		wsConnMu.Lock()
		wsConn = conn
		wsConnMu.Unlock()

		for {
			mt, msg, err := conn.ReadMessage()
			if err != nil {
				log.Printf("ws read error: %v", err)
				return
			}

			if mt == websocket.BinaryMessage {
				go handleMediaChunk(msg)
			} else {
				log.Printf("media ws received message type is not binary")
			}
		}
	})

	// 添加 /msg 路由用于消息处理
	http.HandleFunc("/msg", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("msg ws upgrade error: %v", err)
			return
		}
		defer func() {
			conn.Close()
			// 连接关闭时清理全局变量
			msgWsConnMu.Lock()
			if msgWsConn == conn {
				msgWsConn = nil
			}
			msgWsConnMu.Unlock()
		}()

		msgWsConnMu.Lock()
		msgWsConn = conn
		msgWsConnMu.Unlock()

		for {
			mt, msg, err := conn.ReadMessage()
			if err != nil {
				log.Printf("msg ws read error: %v", err)
				return
			}

			if mt == websocket.TextMessage {
				handleMessage(msg)
			} else {
				log.Printf("msg ws received message type is not text")
			}

		}
	})

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Printf("ws listen error: %v", err)
		return
	}

	addr := ln.Addr().String()

	go func() {
		if err := http.Serve(ln, nil); err != nil && err != http.ErrServerClosed {
			log.Printf("ws server error: %v", err)
		}
	}()

	info := map[string]string{
		"type":    "ws",
		"mediaWs": fmt.Sprintf("ws://%s", addr),
		"msgWs":   fmt.Sprintf("ws://%s/msg", addr),
	}
	if b, err := json.Marshal(info); err == nil {
		fmt.Println(string(b))
	} else {
		log.Printf("failed to marshal ws info: %v", err)
	}

	// 启动RTC状态报告器
	go rtcStatusReporter()
}

func selectBestAudioFrame(targetBitrate uint32) uint32 {
	var bestBitrate uint32
	bestBitrate = audioBitrateList[0]
	for _, bitrate := range audioBitrateList {
		if bitrate <= targetBitrate && bitrate > bestBitrate {
			bestBitrate = bitrate
		}
	}
	return bestBitrate
}

func handleMediaChunk(data []byte) {
	if len(data) < 9 {
		log.Printf("Invalid packet size: %d", len(data))
		return
	}
	trackID := data[0]
	var duration time.Duration
	var mediaData []byte
	var chunkBitrate uint32
	if trackID == SCREEN_SHARE_VIDEO {
		duration = time.Second / 30
	} else {
		duration = time.Duration(binary.LittleEndian.Uint64(data[1:9]))
	}
	if trackID == CPA_AUDIO || trackID == MICROPHONE_AUDIO {
		chunkBitrate = binary.LittleEndian.Uint32(data[9:13])
		mediaData = data[13:]
	} else {
		mediaData = data[9:]
	}

	// write sample to connections which is in chat
	rtcManager.mu.RLock()
	defer rtcManager.mu.RUnlock()
	for _, connection := range rtcManager.connections {
		connection.mu.RLock()
		if connection.isInChat != true {
			connection.mu.RUnlock()
			continue
		}
		if connection.pc.ConnectionState() != webrtc.PeerConnectionStateConnected {
			connection.mu.RUnlock()
			continue
		}
		track, exist := connection.tracks[trackID]
		if !exist {
			log.Printf("Track not found: %d", trackID)
			connection.mu.RUnlock()
			continue
		}

		if chunkBitrate == selectBestAudioFrame(uint32(connection.targetBitrate/2)) {
			track.WriteSample(media.Sample{
				Data:     mediaData,
				Duration: duration,
			})
		}

		connection.mu.RUnlock()
	}

}

func handleMessage(data []byte) {
	var jsonData interface{}
	if err := json.Unmarshal(data, &jsonData); err != nil {
		log.Printf("Failed to decode JSON: %v", err)
	} else {
		msgType := jsonData.(map[string]interface{})["type"]
		switch msgType {
		case "userState":
			if _, ok := jsonData.(map[string]interface{})["userState"]; !ok {
				log.Printf("userState message does not contain userState field")
				break
			}

			log.Printf("broadcasting userState: %v", jsonData)
			for _, connection := range rtcManager.connections {
				if connection.dc != nil && connection.dc.ReadyState() == webrtc.DataChannelStateOpen {
					err := connection.dc.SendText(string(data))
					if err != nil {
						log.Printf("[RTC] Failed to send userState to %s via dc: %v", connection.peerIP, err)
					}
				}
			}
		case "mirrorLocalState":
			if userStateData, ok := jsonData.(map[string]interface{})["userState"]; ok {
				userStateJSON, err := json.Marshal(userStateData)
				if err != nil {
					log.Printf("Failed to marshal userState: %v", err)
					break
				}

				var newState PeerState
				if err := json.Unmarshal(userStateJSON, &newState); err != nil {
					log.Printf("Failed to unmarshal userState to PeerState: %v", err)
					break
				}

				mirrorStateMu.Lock()
				mirrorState = newState
				mirrorStateMu.Unlock()

				if rtcManager != nil {
					go rtcManager.broadcastUserState(newState)
				}

				// log.Printf("[userState] Updated mirrorState: %+v", mirrorState)
			} else {
				log.Printf("[userState] mirrorLocalState message does not contain userState field")
			}
		case "dm":
			if _, ok := jsonData.(map[string]interface{})["content"].(string); !ok {
				log.Printf("[dm] dm message does not contain content field")
			}

			handleDM(jsonData, data)

		case "local_offer":
			// 解析 offer 和 ice 字段
			offerData, hasOffer := jsonData.(map[string]interface{})["offer"]
			iceData, hasIce := jsonData.(map[string]interface{})["ice"]

			if !hasOffer {
				log.Printf("[TestRTC] offer message does not contain offer field")
				break
			}
			if !hasIce {
				log.Printf("[TestRTC] offer message does not contain ice field")
				break
			}

			rtcManager.createLocalRTC(offerData, iceData)
		default:
			log.Printf("[localRTC] Unknown message type: %v", msgType)
		}
	}
}

func handleDM(jsonData interface{}, data []byte) {
	// 检查是否有 targetPeers 字段
	var targetPeers []string
	if targetPeersRaw, hasTargetPeers := jsonData.(map[string]interface{})["targetPeers"]; hasTargetPeers {
		// 尝试将 targetPeers 转换为字符串数组
		if targetPeersArray, ok := targetPeersRaw.([]interface{}); ok {
			for _, peer := range targetPeersArray {
				if peerStr, ok := peer.(string); ok {
					targetPeers = append(targetPeers, peerStr)
				}
			}
		}
	}

	log.Printf("[dm] Sending message to peers: %v", targetPeers)

	for _, connection := range rtcManager.connections {
		if connection.dc != nil && connection.dc.ReadyState() == webrtc.DataChannelStateOpen {
			// 如果有 targetPeers 字段，检查当前连接是否在目标列表中
			if len(targetPeers) > 0 {
				found := false
				for _, targetPeer := range targetPeers {
					if connection.peerIP == targetPeer {
						found = true
						break
					}
				}
				if !found {
					continue // 跳过不在目标列表中的连接
				}
			}

			err := connection.dc.SendText(string(data))
			if err != nil {
				log.Printf("[RTC] Failed to send dm to %s via dc: %v", connection.peerIP, err)
			} else {
				log.Printf("[RTC] Successfully sent dm to %s via dc", connection.peerIP)
			}
		}
	}

}

func sendMsgWs(data []byte) error {
	msgWsConnMu.Lock()
	defer msgWsConnMu.Unlock()

	if msgWsConn == nil {
		return fmt.Errorf("msgWsConn is not connected")
	}

	err := msgWsConn.WriteMessage(websocket.TextMessage, data)
	if err != nil {
		log.Printf("Failed to send message via msgWsConn: %v", err)
		msgWsConn = nil
		return err
	}

	return nil
}

func sendMediaWs(data []byte) error {
	wsConnMu.Lock()
	defer wsConnMu.Unlock()

	if wsConn == nil {
		return fmt.Errorf("wsConn is not connected")
	}

	err := wsConn.WriteMessage(websocket.BinaryMessage, data)
	if err != nil {
		log.Printf("Failed to send media data via wsConn: %v", err)
		wsConn = nil
		return err
	}

	return nil
}

// RTCConnectionStatus 表示RTC连接的状态信息
type RTCConnectionStatus struct {
	PeerIP           string    `json:"peerIP"`
	Role             string    `json:"role"`
	State            string    `json:"state"`
	CreatedAt        time.Time `json:"createdAt"`
	LastPingTime     time.Time `json:"lastPingTime"`
	Latency          string    `json:"latency"`
	HasDataChannel   bool      `json:"hasDataChannel"`
	DataChannelReady bool      `json:"dataChannelReady"`
}

// RTCManagerStatus 表示整个RTC管理器的状态信息
type RTCManagerStatus struct {
	Type        string                `json:"type"`
	Timestamp   time.Time             `json:"timestamp"`
	Connections []RTCConnectionStatus `json:"connections"`
	TotalPeers  int                   `json:"totalPeers"`
}

// getRTCManagerStatus 获取RTC管理器的当前状态
func getRTCManagerStatus() *RTCManagerStatus {
	if rtcManager == nil {
		return &RTCManagerStatus{
			Type:        "rtc_status",
			Timestamp:   time.Now(),
			Connections: []RTCConnectionStatus{},
			TotalPeers:  0,
		}
	}

	rtcManager.mu.RLock()
	defer rtcManager.mu.RUnlock()

	status := &RTCManagerStatus{
		Type:        "rtc_status",
		Timestamp:   time.Now(),
		Connections: make([]RTCConnectionStatus, 0, len(rtcManager.connections)),
		TotalPeers:  len(rtcManager.connections),
	}

	for _, connection := range rtcManager.connections {
		connection.mu.RLock()
		connection.pingMu.RLock()

		connState := "unknown"
		if connection.pc != nil {
			connState = connection.pc.ConnectionState().String()
		}

		dataChannelReady := false
		if connection.dc != nil {
			dataChannelReady = connection.dc.ReadyState() == webrtc.DataChannelStateOpen
		}

		latencyStr := "unknown"
		if connection.latency > 0 {
			latencyStr = connection.latency.String()
		}

		connStatus := RTCConnectionStatus{
			PeerIP:           connection.peerIP,
			Role:             string(connection.role),
			State:            connState,
			CreatedAt:        connection.CreatedAt,
			LastPingTime:     connection.lastPingTime,
			Latency:          latencyStr,
			HasDataChannel:   connection.dc != nil,
			DataChannelReady: dataChannelReady,
		}

		connection.pingMu.RUnlock()
		connection.mu.RUnlock()

		status.Connections = append(status.Connections, connStatus)
	}

	return status
}

// rtcStatusReporter 定期发送RTC状态信息
func rtcStatusReporter() {
	ticker := time.NewTicker(2 * time.Second) // 每2秒发送一次状态
	defer ticker.Stop()

	for range ticker.C {
		status := getRTCManagerStatus()

		jsonData, err := json.Marshal(status)
		if err != nil {
			log.Printf("Failed to marshal RTC status: %v", err)
			continue
		}

		// 使用包装方法发送消息
		err = sendMsgWs(jsonData)
		if err != nil {
			// 错误已经在 sendMsgWs 中处理和记录了
			continue
		}
	}
}
