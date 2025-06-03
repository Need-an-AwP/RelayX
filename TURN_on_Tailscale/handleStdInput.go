package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

func handleStdInput(ctx context.Context, cancel context.CancelFunc) {
	go func() {
		reader := bufio.NewReader(os.Stdin)
		for {
			input, _ := reader.ReadString('\n')
			input = strings.TrimSpace(input)

			// 首先尝试解析为JSON
			var jsonMsg any
			if err := json.Unmarshal([]byte(input), &jsonMsg); err == nil {
				// JSON解析成功，处理JSON消息，传递原始input
				handleJSONMessage(jsonMsg, input)
			} else {
				// JSON解析失败，按原有的字符串命令处理
				handleStringCommand(ctx, cancel, input)
			}
		}
	}()
}

func postWithTimeout(url string, payload []byte) error {
	client := &http.Client{
		Timeout: HTTP_TIMEOUT,
		Transport: &http.Transport{
			DialContext: server.Dial, //use tailscale dialer
		},
	}
	req, err := http.NewRequest("POST", url, bytes.NewReader(payload))
	if err != nil {
		return err
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

// 处理JSON消息
func handleJSONMessage(msg any, originalInput string) {
	// 将any类型断言为map[string]interface{}
	msgMap, ok := msg.(map[string]interface{})
	if !ok {
		log.Printf("Invalid JSON message format: expected object, got %T", msg)
		fmt.Printf("{\"type\":\"error\", \"message\":\"invalid JSON message format\"}\n")
		return
	}

	// 获取type字段
	msgType, ok := msgMap["type"].(string)
	if !ok {
		log.Printf("Missing or invalid 'type' field in JSON message")
		fmt.Printf("{\"type\":\"error\", \"message\":\"missing or invalid 'type' field\"}\n")
		return
	}
	// search peerIP from onlinePeers map by peerID(only for local identification)
	peerID := msgMap["Target"].(string)
	peerIP := onlinePeers[peerID].TailscaleIPs[0].String()

	switch msgType {
	case "offer":
		// 直接发送原始JSON字符串
		err := postWithTimeout("http://"+peerIP+":8848/offer_ice", []byte(originalInput))
		if err != nil {
			log.Printf("Error sending offer to peer %s: %v", peerIP, err)
			fmt.Printf("{\"type\":\"error\", \"message\":\"failed to send offer to peer\"}\n")
		} else {
			log.Printf("Successfully sent offer to peer %s", peerIP)
		}
		
	case "answer":
		err := postWithTimeout("http://"+peerIP+":8848/answer_ice", []byte(originalInput))
		if err != nil {
			log.Printf("Error sending answer to peer %s: %v", peerIP, err)
			fmt.Printf("{\"type\":\"error\", \"message\":\"failed to send answer to peer\"}\n")
		} else {
			log.Printf("Successfully sent answer to peer %s", peerIP)
		}

	default:
		log.Printf("Unknown JSON message type: %s", msgType)
		fmt.Printf("{\"type\":\"error\", \"message\":\"unknown message type: %s\"}\n", msgType)
	}
}

// 处理字符串命令
func handleStringCommand(ctx context.Context, cancel context.CancelFunc, input string) {
	switch input {
	case "quit":
		log.Println("Received quit command. Shutting down...")
		cancel()   // Cancel the main context to stop other goroutines
		os.Exit(0) // Exit the application
	case "client-status":
		statusCtx, statusCancel := context.WithTimeout(ctx, 5*time.Second)
		st, err := localClient.Status(statusCtx)
		statusCancel()
		if err != nil {
			fmt.Printf("{\"type\":\"tailscaleInfo\", \"status\":\"get tailscale client status failed, error:%v\"}\n", err)
		} else {
			jsonData, jsonErr := json.Marshal(st)
			if jsonErr != nil {
				log.Printf("Error marshalling tailscale status to JSON: %v", jsonErr)
				fmt.Printf("{\"type\":\"tailscaleInfo\", \"status\":\"error marshalling tailscale status to JSON: %v\"}\n", jsonErr)
			} else {
				fmt.Printf("{\"type\":\"tailscaleInfo\", \"status\":%s}\n", jsonData)
			}
		}
	default:
		fmt.Printf("{\"type\":\"error\", \"message\":\"Invalid command: %s\"}\n", input)
	}
}
