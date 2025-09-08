package main

import (
	"encoding/json"
	"log"

	"github.com/pion/webrtc/v4"
)

func (rm *RTCManager) setupDataChannelHandlers(dc *webrtc.DataChannel, peerIP string) {
	dc.OnOpen(func() {
		log.Printf("[RTC datachannel] Data channel %v opened", dc.Label())
		// send userState asap
		mirrorStateMu.RLock()
		userStateMsg := map[string]interface{}{
			"type":      "userState",
			"userState": mirrorState,
		}
		mirrorStateMu.RUnlock()

		if jsonData, err := json.Marshal(userStateMsg); err == nil {
			dc.SendText(string(jsonData))
			// log.Printf("[RTC datachannel] Sent initial userState to %s, content: %v", peerIP, userStateMsg)
		} else {
			log.Printf("[RTC datachannel] Failed to marshal userState: %v", err)
		}
	})

	dc.OnClose(func() {
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

func (rm *RTCManager) broadcastUserState() {
	mirrorStateMu.RLock()
	userStateMsg := map[string]interface{}{
		"type":      "userState",
		"userState": mirrorState,
	}
	mirrorStateMu.RUnlock()

	if jsonData, err := json.Marshal(userStateMsg); err == nil {
		rm.mu.RLock()
		defer rm.mu.RUnlock()

		for _, connection := range rm.connections {
			if connection.dc != nil && connection.dc.ReadyState() == webrtc.DataChannelStateOpen {
				go func(dc *webrtc.DataChannel, peerIP string) {
					if err := dc.SendText(string(jsonData)); err != nil {
						log.Printf("[RTC] Failed to broadcast userState to %s: %v", peerIP, err)
					}
				}(connection.dc, connection.peerIP)
			}
		}
	}
}
