package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	// "github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
	"tailscale.com/ipn/ipnstate"
)

func checkHTTP(peerIP string) (*NodeInfo, error) {
	client := &http.Client{
		Timeout: HTTP_TIMEOUT,
		Transport: &http.Transport{
			DialContext: server.Dial, //use tailscale dialer
		},
	}
	resp, err := client.Get(fmt.Sprintf("http://%s:8848/", peerIP))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP状态码: %d", resp.StatusCode)
	}

	var peerInfo NodeInfo
	if err := json.NewDecoder(resp.Body).Decode(&peerInfo); err != nil {
		return nil, err
	}

	return &peerInfo, nil
}

func shouldInitiateOffer(peerInfo *NodeInfo) bool {
	// 比较启动时间，早启动的发起offer
	if nodeInfo.StartTime != peerInfo.StartTime {
		return nodeInfo.StartTime < peerInfo.StartTime
	}
	// 时间相同则比较随机ID
	return nodeInfo.RandomID < peerInfo.RandomID
}

func checkNodeAccessibility(peer *ipnstate.PeerStatus) {
	peerIP := peer.TailscaleIPs[0].String()
	// 检查可访问性
	peerInfo, err := checkHTTP(peerIP)
	if err != nil {
		fmt.Printf("{\"type\":\"accessibility\",\"character\":\"NONE\",\"peerID\":\"%s\"}\n", peer.ID)
		return
	}
	// log.Printf("节点 %s 可访问，节点信息: %+v", peerIP, peerInfo)

	// only http temperary
	// go WSconnect(peerIP)

	// 确定谁发起offer
	var character string
	if shouldInitiateOffer(peerInfo) {
		log.Printf("this is OFFER side, ANSWER side is %s", peerIP)
		character = "OFFER"
		// rtcManager, _ := GetOrCreateRTCManager(peerIP)
		// rtcManager.Init()
	} else {
		log.Printf("this is ANSWER side, OFFER side is %s", peerIP)
		character = "ANSWER"
		// rtcManager, _ := GetOrCreateRTCManager(peerIP)
		// rtcManager.InitAsAnswer()
	}
	fmt.Printf("{\"type\":\"accessibility\",\"character\":\"%s\",\"peerID\":\"%s\",\"peerIP\":\"%s\"}\n", character, peer.ID, peerIP)
}

func ConnectionManager(ctx context.Context) {
	go func() {
		// log.Println("连接管理器启动")
		ticker := time.NewTicker(HTTP_TIMEOUT)
		defer ticker.Stop()

		rtcConnectionMutex.Lock()
		rtcConnectionStatus = make(map[string]webrtc.PeerConnectionState)
		rtcConnectionMutex.Unlock()

		for {
			select {
			case <-ctx.Done():
				log.Println("连接管理器停止")
				return
			case <-ticker.C:
				peersMutex.RLock()
				peers := make(map[string]*ipnstate.PeerStatus)
				for k, v := range onlinePeers {
					peers[k] = v
				}
				peersMutex.RUnlock()

				for _, peer := range peers {
					if len(peer.TailscaleIPs) > 0 {
						peerIP := peer.TailscaleIPs[0].String()

						// 检查是否已有连接
						rtcConnectionMutex.RLock()
						status, ok := rtcConnectionStatus[peerIP]
						if !ok || status != webrtc.PeerConnectionStateConnected {
							go checkNodeAccessibility(peer)
						}
						rtcConnectionMutex.RUnlock()
					}
				}
			}
		}
	}()
}
