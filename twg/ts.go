package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net"
	"net/http"
	"os"
	"time"

	"tailscale.com/client/local"
	"tailscale.com/ipn"
	"tailscale.com/tsnet"
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

	initComplete := make(chan struct {
		srv          *tsnet.Server
		lc           *local.Client
		udpConn      net.PacketConn
		rtcConn      net.PacketConn
		httpListener net.Listener
		httpClient   *http.Client
	})

	// using native watching method instead of ticker polling
	go startBackendStateMonitor(lc, srv, hostName, initComplete)

	result := <-initComplete
	return result.srv, result.lc, result.udpConn, result.rtcConn, result.httpListener, result.httpClient
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

	// httpClient := server.HTTPClient()// tailscale's http client
	httpClient := &http.Client{ // customized http client
		Timeout: 5 * time.Second,
		Transport: &http.Transport{
			DialContext: server.Dial,
		},
	}

	return udpConn, rtcConn, httpListener, httpClient
}

func startBackendStateMonitor(
	lc *local.Client,
	srv *tsnet.Server,
	hostname string,
	initComplete chan struct {
		srv          *tsnet.Server
		lc           *local.Client
		udpConn      net.PacketConn
		rtcConn      net.PacketConn
		httpListener net.Listener
		httpClient   *http.Client
	},
) {
	ctx := context.Background()
	initialized := false

	watcher, err := lc.WatchIPNBus(ctx, ipn.NotifyInitialState|ipn.NotifyInitialNetMap)
	if err != nil {
		log.Printf("Failed to watch IPN bus: %v", err)
		return
	}
	defer watcher.Close()

	log.Printf("Backend state monitor started using native IPN bus watcher")

	for {
		notify, err := watcher.Next()
		if err != nil {
			log.Printf("IPN bus watcher error: %v", err)
			return
		}

		if notify.State != nil {
			backendState := notify.State.String()

			type jsonStruct struct {
				Type         string `json:"type"`
				BackendState string `json:"state"`
				Timestamp    int64  `json:"timestamp"`
			}

			data := jsonStruct{
				Type:         "tsBackendState",
				BackendState: backendState,
				Timestamp:    time.Now().UTC().Unix(),
			}

			jsonData, err := json.Marshal(data)
			if err != nil {
				log.Printf("Failed to marshal backend state data: %v", err)
				continue
			}

			fmt.Println(string(jsonData))

			if backendState == "Running" && !initialized {
				go func() {
					st, err := lc.Status(ctx) // get a full status of tailscale
					if err != nil {
						log.Printf("Failed to get status during initialization: %v", err)
						return
					}

					if len(st.Self.TailscaleIPs) == 0 {
						log.Printf("No Tailscale IPs available")
						return
					}

					selfAddr := st.Self.TailscaleIPs[0].String()
					initNodeInfo(selfAddr, hostname)
					udpConn, rtcConn, httpListener, httpClient := initConns(srv, selfAddr)

					// status stdout loop
					ticker := time.NewTicker(1 * time.Second)
					go func() {
						defer ticker.Stop()
						for range ticker.C {
							st, err := lc.Status(ctx)
							jsonData, err := json.Marshal(st)
							if err != nil {
								log.Printf("Error marshalling tailscale status to JSON: %v", err)
							}
							fmt.Printf("{\"type\":\"tsStatus\", \"status\":%s}\n", jsonData)
						}
					}()

					initComplete <- struct {
						srv          *tsnet.Server
						lc           *local.Client
						udpConn      net.PacketConn
						rtcConn      net.PacketConn
						httpListener net.Listener
						httpClient   *http.Client
					}{
						srv:          srv,
						lc:           lc,
						udpConn:      udpConn,
						rtcConn:      rtcConn,
						httpListener: httpListener,
						httpClient:   httpClient,
					}
				}()
				initialized = true
			}
		}
	}
}
