package main

import (
	"encoding/json"
	"log"
	"time"
)

type BER struct {
	Type           string         `json:"type"` // "BER"
	Timestamp      int64          `json:"timestamp"`
	TargetBitrates map[string]int `json:"targetBitrates"`
}

func (rm *RTCManager) reportBandwidthEstimates() {
	rm.estimatorsMu.RLock()
	defer rm.estimatorsMu.RUnlock()

	if len(rm.estimators) == 0 {
		return
	}

	targetBitrates := make(map[string]int)
	for peerIP, estimator := range rm.estimators {
		if estimator != nil {
			targetBitrate := estimator.GetTargetBitrate()
			targetBitrates[peerIP] = targetBitrate
		}
	}

	ber := &BER{
		Type:           "BER",
		Timestamp:      time.Now().Unix(),
		TargetBitrates: targetBitrates,
	}

	jsonData, err := json.Marshal(ber)
	if err != nil {
		log.Printf("[BandwidthMonitor] Failed to marshal BER: %v", err)
		return
	}

	sendMsgWs(jsonData)
}

func (rm *RTCManager) printAllEstimators() {
	rm.estimatorsMu.RLock()
	defer rm.estimatorsMu.RUnlock()

	if len(rm.estimators) == 0 {
		return
	}

	log.Printf("[BandwidthMonitor] Active estimators: %d", len(rm.estimators))
	for id, estimator := range rm.estimators {
		if estimator != nil {
			targetBitrate := estimator.GetTargetBitrate()
			log.Printf("[BandwidthMonitor]		Estimator %s: target bitrate = %d bps (%.2f kbps)",
				id, targetBitrate, float64(targetBitrate)/1000.0)
		}
	}
}

// 清理无效的estimator
func (rm *RTCManager) cleanupEstimators() {
	rm.estimatorsMu.Lock()
	defer rm.estimatorsMu.Unlock()

	// 检查每个estimator是否仍然有效
	for id, estimator := range rm.estimators {
		if estimator == nil {
			delete(rm.estimators, id)
			log.Printf("[BandwidthMonitor] Removed invalid estimator %s", id)
		}
	}
}
