package main

import (
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"tailscale.com/client/local"
	"tailscale.com/tsnet"
)

func main() {
	// Setup signal handling first to catch Ctrl+C during initialization
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	hostname, controlURL, authKey, dirPath, isEphemeral := InitConfig()

	// Initialize TS in a goroutine to avoid blocking signal handling
	type InitResult struct {
		server       *tsnet.Server
		lc           *local.Client
		udpConn      net.PacketConn
		rtcConn      net.PacketConn
		httpListener net.Listener
		httpClient   *http.Client
		err          error
	}

	initResult := make(chan InitResult, 1)

	go func() {
		server, lc, udpConn, rtcConn, httpListener, httpClient := initTS(hostname, authKey, dirPath, isEphemeral)
		initResult <- InitResult{
			server:       server,
			lc:           lc,
			udpConn:      udpConn,
			rtcConn:      rtcConn,
			httpListener: httpListener,
			httpClient:   httpClient,
			err:          nil,
		}
	}()

	// Wait for either initialization completion or termination signal
	var result InitResult
	select {
	case result = <-initResult:
		// Initialization completed successfully
	case <-sigChan:
		// Received termination signal during initialization
		return
	}

	_ = controlURL

	httpReady := make(chan struct{})
	initHttpService(result.httpListener, httpReady)
	<-httpReady

	go startOnlineBroadcast(result.udpConn, result.lc)

	go initWebRTC(result.rtcConn, result.httpClient)

	go initWsService()

	go handleStdInput()

	<-sigChan

	// clean
	if result.udpConn != nil {
		result.udpConn.Close()
	}
	if result.rtcConn != nil {
		result.rtcConn.Close()
	}
	if result.httpListener != nil {
		result.httpListener.Close()
	}
	if result.server != nil {
		result.server.Close()
	}
}
