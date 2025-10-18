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

var audioBitrateList = []uint32{32000, 64000, 128000}
var videoBitrateList = []uint32{300000, 1000000, 5000000}

// calculateBitrateAllocation 根据可用总带宽和活跃轨道计算码率分配
func calculateBitrateAllocation(totalBitrate int, activeStreams map[uint8]bool) map[uint8]uint32 {
	bitrates := make(map[uint8]uint32)

	// 检查是否有视频流
	hasVideo := activeStreams[SCREEN_SHARE_VIDEO]
	hasMicrophone := activeStreams[MICROPHONE_AUDIO]
	hasCPA := activeStreams[CPA_AUDIO]

	if hasVideo {
		// 有视频流的情况：音频用最低码率，剩余给视频
		if hasMicrophone {
			bitrates[MICROPHONE_AUDIO] = audioBitrateList[0] // 32kbps
		}
		if hasCPA {
			bitrates[CPA_AUDIO] = audioBitrateList[0] // 32kbps
		}

		// 计算音频总消耗
		audioConsumption := uint32(0)
		if hasMicrophone {
			audioConsumption += audioBitrateList[0]
		}
		if hasCPA {
			audioConsumption += audioBitrateList[0]
		}

		// 剩余带宽分配给视频，选择最高可用码率
		remainingBitrate := uint32(totalBitrate) - audioConsumption
		videoBitrate := videoBitrateList[0] // 默认最低视频码率
		for i := len(videoBitrateList) - 1; i >= 0; i-- {
			if videoBitrateList[i] <= remainingBitrate {
				videoBitrate = videoBitrateList[i]
				break
			}
		}
		bitrates[SCREEN_SHARE_VIDEO] = videoBitrate

	} else if hasMicrophone && hasCPA {
		// 只有音频流，两个音频流均分带宽
		availablePerStream := uint32(totalBitrate) / 2

		// 为每个音频流选择最高可用码率
		micBitrate := audioBitrateList[0]
		for i := len(audioBitrateList) - 1; i >= 0; i-- {
			if audioBitrateList[i] <= availablePerStream {
				micBitrate = audioBitrateList[i]
				break
			}
		}

		cpaBitrate := audioBitrateList[0]
		for i := len(audioBitrateList) - 1; i >= 0; i-- {
			if audioBitrateList[i] <= availablePerStream {
				cpaBitrate = audioBitrateList[i]
				break
			}
		}

		bitrates[MICROPHONE_AUDIO] = micBitrate
		bitrates[CPA_AUDIO] = cpaBitrate

	} else if hasMicrophone {
		// 只有麦克风音频流，选择最高可用码率
		micBitrate := audioBitrateList[0]
		for i := len(audioBitrateList) - 1; i >= 0; i-- {
			if audioBitrateList[i] <= uint32(totalBitrate) {
				micBitrate = audioBitrateList[i]
				break
			}
		}
		bitrates[MICROPHONE_AUDIO] = micBitrate

	} else if hasCPA {
		// 只有CPA音频流，选择最高可用码率
		cpaBitrate := audioBitrateList[0]
		for i := len(audioBitrateList) - 1; i >= 0; i-- {
			if audioBitrateList[i] <= uint32(totalBitrate) {
				cpaBitrate = audioBitrateList[i]
				break
			}
		}
		bitrates[CPA_AUDIO] = cpaBitrate
	}

	return bitrates
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
			// save for reporting
			targetBitrates[peerIP] = targetBitrate

			// save for choosing audio chunk data
			rm.mu.RLock()
			if connection, exists := rm.connections[peerIP]; exists {
				connection.mu.Lock()

				// 确定当前活跃的流
				activeStreams := make(map[uint8]bool)
				mirrorStateMu.RLock()
				if mirrorState.IsInChat {
					activeStreams[MICROPHONE_AUDIO] = true
				}
				if mirrorState.IsSharingAudio {
					activeStreams[CPA_AUDIO] = true
				}
				if mirrorState.IsSharingScreen {
					activeStreams[SCREEN_SHARE_VIDEO] = true
				}
				mirrorStateMu.RUnlock()

				// 使用新的码率分配策略
				connection.targetBitrates = calculateBitrateAllocation(targetBitrate, activeStreams)

				connection.mu.Unlock()
			}
			rm.mu.RUnlock()
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
