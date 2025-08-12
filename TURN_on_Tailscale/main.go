package main

import (
	"context"
	"log"
)

func main() {
	log.Println("Application started. Main goroutine is now idle (due to select{}).")
	hostname, controlURL, authKey, dirPath = InitConfig()

	mainCtx, cancel := context.WithCancel(context.Background())
	defer cancel()

	InitNode()
	if server != nil {
		defer server.Close()
	}

	ScanOnlineNodes(mainCtx)

	ConnectionManager(mainCtx)

	handleStdInput(mainCtx, cancel)

	log.Println("Application started. Main goroutine is now idle (due to select{}).")
	select {}
}
