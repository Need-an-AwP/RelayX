package main

import (
	"github.com/pion/webrtc/v4"
	"log"
	"time"
)

func (rm *RTCManager) sendPingsByPdc() {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	for _, connection := range rm.connections {
		if connection.pdc != nil {
			if connection.pdc.ReadyState() == webrtc.DataChannelStateOpen {
				connection.pingMu.Lock()
				connection.lastPingTime = time.Now()
				connection.pingMu.Unlock()

				err := connection.pdc.SendText("ping")
				if err != nil {
					log.Printf("[RTC] Failed to send ping to %s: %v", connection.peerIP, err)
				}
			}
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
					log.Printf("[RTC ping] Latency to %s: %v", peerIP, latency)
				}
			}
		}
	})
}
