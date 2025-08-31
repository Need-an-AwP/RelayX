package main

import (
	"maps"
	"encoding/json"
	_"fmt"
	"time"
)

var onlinePeersCheckingInterval = 6 * time.Second

func initOnlinePeers() {
	onlinePeersMu.Lock()
	onlinePeers = make(map[string]OnlinePeerData)
	onlinePeersMu.Unlock()

	go stdoutOnlinePeersLoop()
	go cleanupExpiredPeersLoop()
}

func stdoutOnlinePeersLoop() {
	ticker := time.NewTicker(broadcastInterval) // use the same interval as broadcast
	defer ticker.Stop()

	for range ticker.C {
		onlinePeersMu.RLock()
		peersCopy := make(map[string]OnlinePeerData)
		maps.Copy(peersCopy, onlinePeers)
		onlinePeersMu.RUnlock()

		jsonData, err := json.Marshal(peersCopy)
		if err != nil {
			continue
		}

		_ = jsonData
		// fmt.Println(string(jsonData))
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