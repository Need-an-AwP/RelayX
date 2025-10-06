package main

import (
	"context"
	"log"
	"net/netip"
	"sync"
	"time"

	"tailscale.com/client/local"
	"tailscale.com/ipn/ipnstate"
	"tailscale.com/tailcfg"
)

// the PeerPingManager do discovery ping for new online peers 
// to promote direct connection between peers
type PeerPingManager struct {
	lc            *local.Client
	ctx           context.Context
	peerPingState map[string]string // key is peerIP, value is "pinging" or "pinged"
	mu            sync.RWMutex
}

func initPeerPingManager(lc *local.Client, ctx context.Context) {
	peerPingManager = &PeerPingManager{
		lc:            lc,
		ctx:           ctx,
		peerPingState: make(map[string]string),
	}

}

func (ppm *PeerPingManager) checkPeerConnections(st *ipnstate.Status) {
	for _, peer := range st.Peer {
		if !peer.Active {
			continue
		}

		// as long as the connection mode is not direct, do the discovery ping
		if peer.CurAddr == "" && peer.Relay != "" {
			peerIP := peer.TailscaleIPs[0].String()

			// check onlinePeers
			onlinePeersMu.RLock()
			_, peerExists := onlinePeers[peerIP]
			onlinePeersMu.RUnlock()

			if peerExists {
				// check ping state
				ppm.mu.RLock()
				_, stateExists := ppm.peerPingState[peerIP]
				ppm.mu.RUnlock()

				if !stateExists {
					ppm.mu.Lock()
					ppm.peerPingState[peerIP] = "pinging"
					ppm.mu.Unlock()

					log.Printf("Starting to ping peer %s (%s) to promote direct connection", peer.HostName, peer.TailscaleIPs[0])
					go ppm.startPing(peer.TailscaleIPs[0])
				}
			}
		}
	}
}

func (ppm *PeerPingManager) startPing(ip netip.Addr) {
	peerIP := ip.String()

	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	pingCount := 0
	maxPingCount := 10

	for range ticker.C {
		_, err := ppm.lc.Ping(ppm.ctx, ip, tailcfg.PingDisco) // 使用discovery ping类型来促进直连
		if err != nil {
			log.Printf("Error pinging peer %s: %v", peerIP, err)
		}

		pingCount++
		if pingCount >= maxPingCount {
			break
		}
	}

	ppm.mu.Lock()
	ppm.peerPingState[peerIP] = "pinged"
	ppm.mu.Unlock()

	log.Printf("Finished pinging peer %s (completed %d pings)", peerIP, pingCount)
}

// getPingState 获取指定peer的ping状态
func (ppm *PeerPingManager) getPingState(peerIP string) string {
	ppm.mu.RLock()
	defer ppm.mu.RUnlock()
	return ppm.peerPingState[peerIP]
}

// clearPingState 清除指定peer的ping状态
func (ppm *PeerPingManager) clearPingState(peerIP string) {
	ppm.mu.Lock()
	defer ppm.mu.Unlock()
	delete(ppm.peerPingState, peerIP)
}

// clearAllPingStates 清除所有ping状态
func (ppm *PeerPingManager) clearAllPingStates() {
	ppm.mu.Lock()
	defer ppm.mu.Unlock()
	ppm.peerPingState = make(map[string]string)
}

// resetPingedStates 重置所有"pinged"状态，允许重新ping
// 这对于长时间运行的应用很有用，可以定期重新尝试建立直连
func (ppm *PeerPingManager) resetPingedStates() {
	ppm.mu.Lock()
	defer ppm.mu.Unlock()

	for peerIP, state := range ppm.peerPingState {
		if state == "pinged" {
			delete(ppm.peerPingState, peerIP)
		}
	}

	log.Printf("Reset all 'pinged' states to allow re-pinging")
}

// startPeriodicCleanup 启动定期清理机制，重置"pinged"状态
func (ppm *PeerPingManager) startPeriodicCleanup() {
	ticker := time.NewTicker(5 * time.Minute) // 每5分钟清理一次
	defer ticker.Stop()

	for {
		select {
		case <-ppm.ctx.Done():
			return
		case <-ticker.C:
			ppm.resetPingedStates()
		}
	}
}
