package main

import (
	"encoding/json"
	"log"
	"maps"
	"time"
)

var onlinePeersCheckingInterval = 6 * time.Second

func initOnlinePeers() {
	onlinePeersMu.Lock()
	onlinePeers = make(map[string]OnlinePeerData)
	onlinePeersMu.Unlock()

	go reportOnlinePeersLoop()
	go cleanupExpiredPeersLoop()
}

func reportOnlinePeersLoop() {
	ticker := time.NewTicker(broadcastInterval) // use the same interval as broadcast
	defer ticker.Stop()

	for range ticker.C {
		onlinePeersMu.RLock()
		peersCopy := make(map[string]OnlinePeerData)
		maps.Copy(peersCopy, onlinePeers)
		onlinePeersMu.RUnlock()

		type jsonStruct struct {
			Type  string                    `json:"type"`
			Peers map[string]OnlinePeerData `json:"peers"`
		}
		data := jsonStruct{
			Type:  "onlinePeers",
			Peers: peersCopy,
		}
		jsonData, err := json.Marshal(data)
		if err != nil {
			log.Printf("Failed to marshal online peers data: %v", err)
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

func cleanupExpiredPeersLoop() {
	ticker := time.NewTicker(onlinePeersCheckingInterval)
	defer ticker.Stop()

	for range ticker.C {
		onlinePeersMu.Lock()
		currentTime := time.Now().UTC().Unix()
		for ip, peerData := range onlinePeers {
			if currentTime-peerData.Timestamp > 10 {
				delete(onlinePeers, ip)
			}
		}
		onlinePeersMu.Unlock()
	}
}

// data includes key
func updateOnlinePeer(data OnlinePeerData) {
	onlinePeersMu.Lock()
	defer onlinePeersMu.Unlock()

	onlinePeers[data.NodeInfo.TailscaleIP] = data
}
