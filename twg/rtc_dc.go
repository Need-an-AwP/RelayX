package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/pion/webrtc/v4"
)

func sendState(dc *webrtc.DataChannel, peerIP string) {
	mirrorStateMu.RLock()
	userStateMsg := map[string]interface{}{
		"type":      "userState",
		"userState": mirrorState,
	}
	mirrorStateMu.RUnlock()

	if jsonData, err := json.Marshal(userStateMsg); err == nil {
		if err := dc.SendText(string(jsonData)); err != nil {
			log.Printf("[RTC datachannel] Failed to send initial userState to %s: %v", peerIP, err)
		}
	} else {
		log.Printf("[RTC datachannel] Failed to marshal userState: %v", err)
	}
}

func (rm *RTCManager) setupDataChannelHandlers(dc *webrtc.DataChannel, peerIP string) {
	var ticker *time.Ticker

	dc.OnOpen(func() {
		log.Printf("[RTC datachannel] Data channel %v opened", dc.Label())
		// send userState asap
		sendState(dc, peerIP)

		// a backup method
		ticker = time.NewTicker(5 * time.Second)
		go func() {
			for range ticker.C {
				// log.Printf("[RTC test dc] ticker method dc id: %d", *dc.ID())
				sendState(dc, peerIP)
			}
		}()
	})

	dc.OnClose(func() {
		if ticker != nil {
			ticker.Stop()
		}
		log.Printf("[RTC datachannel] Data channel %v closed", dc.Label())
	})

	dc.OnMessage(func(msg webrtc.DataChannelMessage) {
		log.Printf("[RTC datachannel] Message received on data channel %v: %s", dc.Label(), msg.Data)
		if msg.IsString {
			var jsonData interface{}
			if err := json.Unmarshal(msg.Data, &jsonData); err != nil {
				log.Printf("Failed to decode JSON: %v", err)
			} else {
				msgType := jsonData.(map[string]interface{})["type"]
				switch msgType {

				case "userState":
					jsonData.(map[string]interface{})["from"] = peerIP
					modifiedData, err := json.Marshal(jsonData)
					if err != nil {
						log.Printf("Failed to marshal modified JSON: %v", err)
						return
					}
					log.Printf("receiving userState via dc: %v", jsonData)

					// 使用包装方法发送消息
					err = sendMsgWs(modifiedData)
					if err != nil {
						// 错误已经在 sendMsgWs 中处理和记录了
					}
				}
			}
		}
	})
}

func (rm *RTCManager) broadcastUserState(latestMirrorState PeerState) {
	userStateMsg := map[string]interface{}{
		"type":      "userState",
		"userState": latestMirrorState,
	}

	if jsonData, err := json.Marshal(userStateMsg); err == nil {
		rm.mu.RLock()
		defer rm.mu.RUnlock()

		for _, connection := range rm.connections {
			connection.mu.RLock()

			dc := connection.dc
			peerIP := connection.peerIP
			if dc != nil && dc.ReadyState() == webrtc.DataChannelStateOpen {
				if err := dc.SendText(string(jsonData)); err != nil {
					log.Printf("[RTC] Failed to broadcast userState to %s: %v", peerIP, err)
				}
				log.Printf("[RTC broadcastUserState] broadcasted userState to %s, by dc id: %d", peerIP, *dc.ID())
			}else {
				log.Printf("[RTC broadcastUserState] broadcast failed to %s", peerIP)
			}

			connection.mu.RUnlock()
		}
	}
}
