package main

import (
	// "log"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	hostname, controlURL, authKey, dirPath = InitConfig()
	server, lc, udpConn, rtcConn, httpListener, httpClient := initTS(hostname, authKey, dirPath)

	_ = controlURL

	httpReady := make(chan struct{})
	initHttpService(httpListener, httpReady)
	<-httpReady

	go startOnlineBroadcast(udpConn, lc)

	go initWebRTC(rtcConn, httpClient)

	go initWsService()

	go handleStdInput()

	<-sigChan

	// clean
	if udpConn != nil {
		udpConn.Close()
	}
	if rtcConn != nil {
		rtcConn.Close()
	}
	if httpListener != nil {
		httpListener.Close()
	}
	if server != nil {
		server.Close()
	}
}
