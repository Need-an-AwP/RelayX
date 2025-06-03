package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/netip"
	"os"
	"tailscale.com/tsnet"
	"time"
)

var ipForService string

func initNodeInfo(hostname string) {
	randamID := func() uint64 {
		max := new(big.Int)
		max.Exp(big.NewInt(2), big.NewInt(64), nil).Sub(max, big.NewInt(1))

		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			log.Printf("generate random ID failed: %v", err)
			return uint64(time.Now().UnixNano())
		}

		return n.Uint64()
	}()

	nodeInfo = NodeInfo{
		Hostname:    hostname,
		StartTime:   time.Now().Unix(),
		RandomID:    randamID,
		TailscaleIP: ipForService,
	}
	// log.Printf("节点信息初始化: %+v", nodeInfo)
}

func waitForTailscale() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	for {
		select {
		case <-ctx.Done():
			panic("checkNodeConnection: Failed to obtain Tailscale IP within the timeout.")
		default:
		}

		lcMutex.RLock()
		client := localClient
		lcMutex.RUnlock()

		if client == nil {
			log.Println("checkNodeConnection: localClient not initialized yet, retrying in 1s...")
			time.Sleep(1 * time.Second)
			continue
		}

		statusCtx, statusCancel := context.WithTimeout(ctx, 5*time.Second)
		st, err := client.Status(statusCtx)
		statusCancel()

		if err != nil {
			if errors.Is(err, context.DeadlineExceeded) {
				log.Println("checkNodeConnection: Status check call timed out, retrying in 1s...")
			} else if errors.Is(err, context.Canceled) {
				log.Println("checkNodeConnection: Status check call canceled, likely main context.")
			} else {
				log.Printf("checkNodeConnection: Error getting status: %v, retrying in 1s...", err)
			}
			time.Sleep(1 * time.Second)
			continue
		}

		if st.BackendState == "Running" {
			log.Printf("Connected to Tailscale network. Available IPs: %v", st.TailscaleIPs)
			jsonData, err := json.Marshal(st)
			if err != nil {
				log.Printf("Error marshalling tailscale status to JSON: %v", err)
			}
			fmt.Printf("{\"type\":\"tailscaleInfo\", \"status\":%s}\n", jsonData)
			if len(st.TailscaleIPs) > 0 {
				var chosenIP netip.Addr
				for _, addr := range st.TailscaleIPs {
					if addr.IsValid() && addr.Is4() {
						chosenIP = addr
						break
					}
				}
				if !chosenIP.IsValid() {
					for _, addr := range st.TailscaleIPs {
						if addr.IsValid() {
							chosenIP = addr
							break
						}
					}
				}

				if chosenIP.IsValid() {
					ipForService = chosenIP.String()
					go SetupHttpService(ipForService)
					go SetupTURN(ipForService)
					return
				} else {
					// log.Println("Node is Running, TailscaleIPs list is not empty, but no valid IP could be selected. Retrying in 1s...")
				}
			} else {
				// log.Println("Node is Running, but no Tailscale IPs assigned yet. Retrying in 1s...")
			}
		}
		time.Sleep(1 * time.Second)
	}
}

func InitNode() {
	os.Setenv("TSNET_FORCE_LOGIN", "1")
	srv := &tsnet.Server{
		Ephemeral: true, // ephemeral or not is depend on the authkey's properties
		Hostname:  hostname,
		AuthKey:   authKey,
		Dir:       fmt.Sprintf("tsNodeDir/%s", hostname), // specify the directory for the node storage
		// ControlURL: controlURL,// using Tailscale's official control server
		// Logf:       log.Printf,
	}
	server = srv

	lc, err := srv.LocalClient()
	if err != nil {
		log.Fatal("Error getting local client, quitting...")
	}

	lcMutex.Lock()
	localClient = lc
	lcMutex.Unlock()

	waitForTailscale() // block wait for tailscale connection
	initNodeInfo(hostname)

	fmt.Println("node init done", nodeInfo)
}
