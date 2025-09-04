package main

import (
	// "encoding/binary"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media"
)

var (
	wsConn    *websocket.Conn
	msgWsConn *websocket.Conn
)

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
		defer conn.Close()

		wsConn = conn

		for {
			mt, msg, err := conn.ReadMessage()
			if err != nil {
				log.Printf("ws read error: %v", err)
				return
			}

			if mt == websocket.BinaryMessage {
				handleVideoChunk(msg)
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
		defer conn.Close()

		msgWsConn = conn

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

func handleVideoChunk(data []byte) {
	if len(data) < 16 {
		log.Printf("Invalid packet size: %d", len(data))
		return
	}
	// timestamp := binary.LittleEndian.Uint64(data[0:8]) // 前8字节是时间戳
	// duration := binary.LittleEndian.Uint64(data[8:16]) // 接下来8字节是持续时间
	// log.Printf("Received video chunk: timestamp=%d, duration=%d", timestamp, duration)

	// 剩余的都是视频数据
	videoData := data[16:]

	for _, connection := range rtcManager.connections {
		videoTrack := connection.videoTrack

		videoTrack.WriteSample(media.Sample{
			Data:     videoData,
			Duration: time.Second / 30,
		})
	}
}

func handleMessage(data []byte) {
	log.Printf("Received text message: %s", string(data))

	var jsonData interface{}
	if err := json.Unmarshal(data, &jsonData); err != nil {
		log.Printf("Failed to decode JSON: %v", err)
	} else {
		msgType := jsonData.(map[string]interface{})["type"]
		switch msgType {
		case "userState":
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
			if peerStateData, ok := jsonData.(map[string]interface{})["peerState"]; ok {
				mirrorStateMu.Lock()

				// 更新 mirrorState 的各个字段
				if userName, exists := peerStateData.(map[string]interface{})["userName"]; exists {
					if str, ok := userName.(string); ok {
						mirrorState.UserName = str
					}
				}

				if userAvatar, exists := peerStateData.(map[string]interface{})["userAvatar"]; exists {
					if str, ok := userAvatar.(string); ok {
						mirrorState.UserAvatar = str
					}
				}

				if isInChat, exists := peerStateData.(map[string]interface{})["isInChat"]; exists {
					if b, ok := isInChat.(bool); ok {
						mirrorState.IsInChat = b
					}
				}

				if isInputMuted, exists := peerStateData.(map[string]interface{})["isInputMuted"]; exists {
					if b, ok := isInputMuted.(bool); ok {
						mirrorState.IsInputMuted = b
					}
				}

				if isOutputMuted, exists := peerStateData.(map[string]interface{})["isOutputMuted"]; exists {
					if b, ok := isOutputMuted.(bool); ok {
						mirrorState.IsOutputMuted = b
					}
				}

				if isSharingScreen, exists := peerStateData.(map[string]interface{})["isSharingScreen"]; exists {
					if b, ok := isSharingScreen.(bool); ok {
						mirrorState.IsSharingScreen = b
					}
				}

				if isSharingAudio, exists := peerStateData.(map[string]interface{})["isSharingAudio"]; exists {
					if b, ok := isSharingAudio.(bool); ok {
						mirrorState.IsSharingAudio = b
					}
				}

				mirrorStateMu.Unlock()

				log.Printf("Updated mirrorState: %+v", mirrorState)
			} else {
				log.Printf("mirrorLocalState message does not contain peerState field")
			}

			if rtcManager != nil {
				rtcManager.broadcastUserState()
			}
		default:
			log.Printf("Unknown message type: %v", msgType)
		}

	}

}

func sendViaWS(data []byte) error {
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
		if msgWsConn != nil {
			status := getRTCManagerStatus()

			jsonData, err := json.Marshal(status)
			if err != nil {
				log.Printf("Failed to marshal RTC status: %v", err)
				continue
			}

			err = msgWsConn.WriteMessage(websocket.TextMessage, jsonData)
			if err != nil {
				// 连接可能已断开，清空msgWsConn
				log.Printf("Failed to send RTC status via msgWsConn: %v", err)
				msgWsConn = nil
			}
		}
	}
}
