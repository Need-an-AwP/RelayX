package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
)

func handleStdInput() {
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
			fmt.Printf("Failed to parse JSON: %v", err)
		}
	}
}

func handleJSONMessage(msg any, originalInput string) {
	// 将any类型断言为map[string]interface{}
	msgMap, ok := msg.(map[string]interface{})
	if !ok {
		fmt.Printf("Invalid JSON message format: expected object, got %T", msg)
		return
	}

	msgType, ok := msgMap["type"].(string)
	if !ok {
		fmt.Printf("Missing or invalid 'type' field in JSON message")
		return
	}

	switch msgType {
	case "dc":
		if rtcManager == nil || rtcManager.connections == nil {
			return
		}

		if msgMap["Target"] != nil {
			targetPeerIP := msgMap["Target"].(string)
			if connection, exists := rtcManager.connections[targetPeerIP]; exists && connection != nil {
				if connection.dc != nil {
					connection.dc.SendText(originalInput)
				} else {
					fmt.Printf("Error: data channel is not ready for peer %s", targetPeerIP)
				}
			} else {
				fmt.Printf("Error: no connection found for target peer %s", targetPeerIP)
			}
		} else {
			if len(rtcManager.connections) == 0 {
				return
			}

			for peerIP, connection := range rtcManager.connections {
				if connection != nil && connection.dc != nil {
					connection.dc.SendText(originalInput)
				} else {
					log.Printf("Skipping peer %s: connection or data channel not ready", peerIP)
				}
			}
		}
	case "userState":
		if rtcManager == nil || rtcManager.connections == nil {
			return
		}
	default:
		log.Printf("Unknown message type: %s", msgType)
	}
}
