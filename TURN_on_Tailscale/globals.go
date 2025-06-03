package main

import (
	"net"
	"sync"
	"time"

	// "github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
	"tailscale.com/client/local"
	"tailscale.com/ipn/ipnstate"
	"tailscale.com/tsnet"
)

type NodeInfo struct {
	Hostname    string `json:"hostname"`
	StartTime   int64  `json:"start_time"`
	RandomID    uint64 `json:"random_id"`
	TailscaleIP string `json:"tailscale_ip"`
}

var (
	HTTP_ON_ALL_IPS = false
	HTTP_TIMEOUT    = 10 * time.Second
	authKey         string
	hostname        string
	controlURL      string

	nodeInfo    NodeInfo
	localClient *local.Client
	lcMutex     sync.RWMutex
	server      *tsnet.Server
	listener    net.Listener
	tsStatus    *ipnstate.Status

	onlinePeers = make(map[string]*ipnstate.PeerStatus)
	peersMutex  sync.RWMutex

	rtcConnectionStatus = make(map[string]webrtc.PeerConnectionState)
	rtcConnectionMutex  sync.RWMutex
)


