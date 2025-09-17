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
		// log.Printf("[RTC datachannel] Message received on data channel %v: %s", dc.Label(), msg.Data)
		if msg.IsString {
			var jsonData interface{}
			if err := json.Unmarshal(msg.Data, &jsonData); err != nil {
				log.Printf("Failed to decode JSON: %v", err)
			} else {
				msgType := jsonData.(map[string]interface{})["type"]
				switch msgType {
				case "userState":
					if userStateData, ok := jsonData.(map[string]interface{})["userState"]; ok {
						rm.updateIsInChat(peerIP, userStateData.(map[string]interface{}))
					}

					jsonData.(map[string]interface{})["from"] = peerIP
					modifiedData, err := json.Marshal(jsonData)
					if err != nil {
						log.Printf("[RTC dc] Failed to marshal modified JSON: %v", err)
						return
					}

					err = sendMsgWs(modifiedData)
					if err != nil {
						// 错误已经在 sendMsgWs 中处理和记录了
					}
				default:
					log.Printf("[RTC dc] Unknown message type from %s: %v", peerIP, msgType)
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
					log.Printf("[RTC dc] Failed to broadcast userState to %s: %v", peerIP, err)
				}
				log.Printf("[RTC dc] broadcasted userState to %s, by dc id: %d", peerIP, *dc.ID())
			} else {
				log.Printf("[RTC dc] broadcast failed to %s", peerIP)
			}

			connection.mu.RUnlock()
		}
	}
}

// updateIsInChat 根据接收到的userState更新连接的isInChat状态
func (rm *RTCManager) updateIsInChat(peerIP string, userState map[string]interface{}) {
	rm.mu.RLock()
	connection, exists := rm.connections[peerIP]
	rm.mu.RUnlock()

	if !exists {
		return
	}

	connection.mu.Lock()
	defer connection.mu.Unlock()

	isInChat, ok := userState["isInChat"].(bool)
	if !ok {
		log.Printf("[RTC dc] Failed to get isInChat status for peer %s: value is not a boolean", peerIP)
		return
	}
	connection.isInChat = isInChat

}
