package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net"
	"time"

	"tailscale.com/client/local"
	// "tailscale.com/tsnet"
)


// startOnlineBroadcast 启动UDP在线消息广播
func startOnlineBroadcast(conn net.PacketConn, lc *local.Client) {
	initOnlinePeers()

	go startUDPListener(conn)

	ticker := time.NewTicker(broadcastInterval)
	defer ticker.Stop()

	for range ticker.C {
		broadcastToOnlinePeers(conn, lc)
	}
}

// broadcastToOnlinePeers 向所有在线的peer发送UDP广播消息
func broadcastToOnlinePeers(sendConn net.PacketConn, lc *local.Client) {
	ctx := context.Background()
	status, err := lc.Status(ctx)
	if err != nil {
		log.Printf("Failed to get status: %v", err)
		return
	}

	if status.BackendState != "Running" {
		log.Printf("Backend not running, current state: %s", status.BackendState)
		return
	}

	broadcastData := OnlinePeerData{
		NodeInfo:  nodeInfo,
		Timestamp: time.Now().UTC().Unix(),
	}

	messageBytes, err := json.Marshal(broadcastData)
	if err != nil {
		log.Printf("Failed to marshal broadcast data: %v", err)
		return
	}

	// 获取所有在线的peer
	for _, peer := range status.Peer {
		if peer.Online && len(peer.TailscaleIPs) > 0 {
			peerIP := peer.TailscaleIPs[0].String()
			go sendUDPMessage(sendConn, peerIP, string(messageBytes))
		}
	}
}

// sendUDPMessage 向指定peer发送UDP消息
func sendUDPMessage(conn net.PacketConn, peerIP string, message string) {
	targetAddr, err := net.ResolveUDPAddr("udp", net.JoinHostPort(peerIP, udpPort))
	if err != nil {
		log.Printf("Failed to resolve UDP address for %s: %v", peerIP, err)
		return
	}

	_, err = conn.WriteTo([]byte(message), targetAddr)
	if err != nil {
		log.Printf("Failed to send UDP message to %s: %v", peerIP, err)
		return
	}
}

// startUDPListener 启动UDP监听器来接收广播消息
func startUDPListener(conn net.PacketConn) {
	buffer := make([]byte, 1024)
	for {
		n, addr, err := conn.ReadFrom(buffer)
		if err != nil {
			// 检查是否是EOF错误（连接关闭）
			if err == io.EOF {
				return
			}
			log.Printf("Failed to read UDP message: %v", err)
			continue
		}

		// parse json
		var receivedData OnlinePeerData
		if err := json.Unmarshal(buffer[:n], &receivedData); err != nil {
			log.Printf("Failed to unmarshal UDP message from %s: %v", addr.String(), err)
			continue
		}

		updateOnlinePeer(receivedData)
	}
}
