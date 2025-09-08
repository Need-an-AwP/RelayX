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
	wsConn      *websocket.Conn
	wsConnMu    sync.Mutex
	msgWsConn   *websocket.Conn
	msgWsConnMu sync.Mutex
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

func handleMediaChunk(data []byte) {
	if len(data) < 9 {
		log.Printf("Invalid packet size: %d", len(data))
		return
	}
	trackID := data[0]
	var duration time.Duration
	if trackID == SCREEN_SHARE_VIDEO {
		duration = time.Second / 30
	} else {
		duration = time.Duration(binary.LittleEndian.Uint64(data[1:9]))
	}
	mediaData := data[9:]

	// log.Printf("Received video chunk: trackID=%d, duration=%d", trackID, duration)

	for _, connection := range rtcManager.connections {
		track := connection.tracks[trackMap[trackID].id]

		track.WriteSample(media.Sample{
			Data:     mediaData,
			Duration: duration,
		})
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
				// 将 userStateData 重新编组为 JSON，然后解组到 PeerState 结构体
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

				log.Printf("[userState] Updated mirrorState: %+v", mirrorState)
			} else {
				log.Printf("[userState] mirrorLocalState message does not contain userState field")
			}

			if rtcManager != nil {
				rtcManager.broadcastUserState()
			}
		default:
			log.Printf("Unknown message type: %v", msgType)
		}

	}

}

// sendMsgWs 安全地通过 msgWsConn 发送文本消息
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

// sendMediaWs 安全地通过 wsConn 发送二进制消息
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
