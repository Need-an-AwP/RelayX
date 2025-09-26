package main

import (
	"github.com/pion/webrtc/v4"

	"encoding/json"
	"log"
	"time"
)

func (rm *RTCManager) sendPingsByPdc() {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	// 收集所有连接的延迟信息
	type LatencyInfo struct {
		PeerIP  string `json:"peerIP"`
		Latency string `json:"latency"`
	}

	type LatencyUpdate struct {
		Type      string        `json:"type"`
		Timestamp int64         `json:"timestamp"`
		Latencies []LatencyInfo `json:"latencies"`
	}

	var latencies []LatencyInfo

	for _, connection := range rm.connections {
		connection.mu.RLock()
		if connection.pdc != nil {
			if connection.pdc.ReadyState() == webrtc.DataChannelStateOpen {
				connection.pingMu.Lock()

				connection.lastPingTime = time.Now()

				latencies = append(latencies, LatencyInfo{
					PeerIP:  connection.peerIP,
					Latency: connection.latency.String(),
				})

				connection.pingMu.Unlock()

				err := connection.pdc.SendText("ping")
				if err != nil {
					log.Printf("[RTC] Failed to send ping to %s: %v", connection.peerIP, err)
				}
			}
		}
		connection.mu.RUnlock()
	}

	// 发送延迟信息
	if len(latencies) > 0 {
		latencyUpdate := LatencyUpdate{
			Type:      "latency",
			Timestamp: time.Now().UnixMilli(),
			Latencies: latencies,
		}

		jsonData, err := json.Marshal(latencyUpdate)
		if err != nil {
			log.Printf("[RTC] Failed to marshal latency data: %v", err)
			return
		}

		err = sendMsgWs(jsonData)
		if err != nil {
			log.Printf("[RTC] Failed to send latency data via websocket: %v", err)
		}
	}
}

// response pong when receiving ping, calculate latency when receiving pong
func (rm *RTCManager) setupPingDataChannel(pdc *webrtc.DataChannel, peerIP string) {
	pdc.OnMessage(func(msg webrtc.DataChannelMessage) {
		if msg.IsString {
			if string(msg.Data) == "ping" {
				pdc.SendText("pong")
			} else if string(msg.Data) == "pong" {
				rm.mu.RLock()
				connection, exists := rm.connections[peerIP]
				rm.mu.RUnlock()
				if !exists {
					return
				}

				connection.pingMu.Lock()
				defer connection.pingMu.Unlock()

				if !connection.lastPingTime.IsZero() {
					latency := time.Since(connection.lastPingTime)
					connection.latency = latency
					// log.Printf("[RTC ping] Latency to %s: %v", peerIP, latency)
				}
			}
		}
	})
}
