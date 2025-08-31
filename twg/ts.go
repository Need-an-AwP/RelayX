package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"net"
	"net/http"
	"os"
	"tailscale.com/client/local"
	"tailscale.com/tsnet"
	"time"
)

func initNodeInfo(selfIP string, hostname string) {
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
		TailscaleIP: selfIP,
	}
}

func initTS(hostName string, authKey string, dirPath string) (*tsnet.Server, *local.Client, net.PacketConn, net.PacketConn, net.Listener, *http.Client) {
	os.Setenv("TSNET_FORCE_LOGIN", "1")
	srv := &tsnet.Server{
		Ephemeral: true, // ephemeral or not is depend on the authkey's properties
		Hostname:  hostName,
		AuthKey:   authKey,
		Dir:       fmt.Sprintf("%s/%s", dirPath, hostName), // dirPath is tsNodeDir by default, specify the directory for the node storage
		// ControlURL: controlURL,// using Tailscale's official control server
		// Logf:       log.Printf,
	}

	lc, err := srv.LocalClient()
	if err != nil {
		log.Fatal("Error getting local client, quitting...")
	}

	for {
		st, err := lc.Status(context.Background())
		if err != nil {
			time.Sleep(100 * time.Millisecond)
			continue
		}

		if st.BackendState == "Running" {
			selfAddr := st.Self.TailscaleIPs[0].String()
			initNodeInfo(selfAddr, hostname)
			udpConn, rtcConn, httpListener, httpClient := initConns(srv, selfAddr)
			return srv, lc, udpConn, rtcConn, httpListener, httpClient
		}

		time.Sleep(100 * time.Millisecond)
	}
}

func initConns(server *tsnet.Server, selfIP string) (net.PacketConn, net.PacketConn, net.Listener, *http.Client) {
	udpConn, err := server.ListenPacket("udp4", net.JoinHostPort(selfIP, udpPort))
	if err != nil {
		log.Panicf("Failed to create shared UDP connection: %v", err)
	}
	
	rtcConn, err := server.ListenPacket("udp4", net.JoinHostPort(selfIP, "0"))
	if err != nil {
		log.Panicf("Error listening on %s:0: %v", selfIP, err)
	}

	httpListener, err := server.Listen("tcp4", net.JoinHostPort(selfIP, tcpPort))
	if err != nil {
		log.Panicf("Error listening on %s:%s: %v", selfIP, tcpPort, err)
	}

	// httpClient := server.HTTPClient()
	httpClient := &http.Client{
		Timeout: 5 * time.Second,
		Transport: &http.Transport{
			DialContext: server.Dial,
		},
	}

	return udpConn, rtcConn, httpListener, httpClient
}
