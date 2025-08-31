package main

// ATTENTION: EVERY TIMESTAMP SHOULD BE UTC
import (
	// "encoding/json"
	// "fmt"
	"sync"
	"time"
	// "tailscale.com/client/local"
	// "tailscale.com/tsnet"
)

type NodeInfo struct {
	Hostname    string `json:"hostname"`
	StartTime   int64  `json:"start_time"`
	RandomID    uint64 `json:"random_id"`
	TailscaleIP string `json:"tailscale_ip"`
}

type OnlinePeerData struct {
	NodeInfo  NodeInfo `json:"node_info"`
	Timestamp int64    `json:"timestamp"`
}

var (
	udpPort           = "8849"
	tcpPort           = "8848"
	broadcastInterval = 2 * time.Second
	HTTP_TIMEOUT      = 10 * time.Second
	authKey           string
	hostname          string
	controlURL        string
	dirPath           string
	nodeInfo          NodeInfo
	onlinePeers       map[string]OnlinePeerData // key is TailscaleIP
	onlinePeersMu     sync.RWMutex
	rtcManager        *RTCManager
)
