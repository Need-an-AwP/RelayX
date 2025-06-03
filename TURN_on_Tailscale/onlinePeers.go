package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"tailscale.com/ipn/ipnstate"
	"tailscale.com/tailcfg"
)

func ScanOnlineNodes(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				log.Println("扫描在线节点例程停止")
				return
			case <-ticker.C:
				statusCtx, statusCancel := context.WithTimeout(ctx, 5*time.Second)

				lcMutex.RLock()
				client := localClient
				lcMutex.RUnlock()
				if client == nil {
					statusCancel()
					continue
				}

				st, err := client.Status(statusCtx)
				statusCancel()

				if err != nil {
					continue
				}

				// update whole tailscale status
				tsStatus = st
				// update peers list
				updateOnlinePeers(st)
			}
		}
	}()
}

func updateOnlinePeers(st *ipnstate.Status) {
	var selfID tailcfg.StableNodeID

	if st.Self != nil && selfID == "" {
		selfID = st.Self.ID
	}

	peersMutex.Lock()
	onlinePeers = make(map[string]*ipnstate.PeerStatus)
	if st.Peer != nil {
		for _, peer := range st.Peer {
			if peer.ID != selfID && //not self
				peer.Online && //online
				peer.UserID == st.Self.UserID && //in same user
				len(peer.TailscaleIPs) > 0 { //has tailscale ip
				onlinePeers[string(peer.ID)] = peer
			}
		}
	}
	peersMutex.Unlock()

	jsonData, err := json.Marshal(onlinePeers)
	if err != nil {
		log.Printf("Error marshalling onlinePeers to JSON: %v", err)
		return
	}
	fmt.Printf("{\"type\":\"onlinePeers\",\"refreshTime\":%d,\"peers\":%s}\n", time.Now().Unix(), jsonData)
}
