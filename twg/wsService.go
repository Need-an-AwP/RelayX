package main

import (
	// "encoding/binary"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4/pkg/media"
)

var (
	wsConn    *websocket.Conn
	msgWsConn *websocket.Conn
)

// create local websocket server
func initWsService() {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("ws upgrade error: %v", err)
			return
		}
		defer conn.Close()

		wsConn = conn

		for {
			mt, msg, err := conn.ReadMessage()
			if err != nil {
				log.Printf("ws read error: %v", err)
				return
			}

			if mt == websocket.BinaryMessage {
				handleVideoChunk(msg)
			} else {
				log.Printf("media ws received message type is not binary")
			}
		}
	})

	// 添加 /msg 路由用于消息处理
	http.HandleFunc("/msg", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("msg ws upgrade error: %v", err)
			return
		}
		defer conn.Close()

		msgWsConn = conn

		for {
			mt, msg, err := conn.ReadMessage()
			if err != nil {
				log.Printf("msg ws read error: %v", err)
				return
			}

			if mt == websocket.TextMessage {
				handleMessage(msg)
			} else {
				log.Printf("msg ws received message type is not text")
			}

		}
	})

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Printf("ws listen error: %v", err)
		return
	}

	addr := ln.Addr().String()

	go func() {
		if err := http.Serve(ln, nil); err != nil && err != http.ErrServerClosed {
			log.Printf("ws server error: %v", err)
		}
	}()

	// 输出为 JSON 格式，包含 type 和 address
	info := map[string]string{
		"type":    "ws",
		"mediaWs": fmt.Sprintf("ws://%s", addr),
		"msgWs":   fmt.Sprintf("ws://%s/msg", addr),
	}
	if b, err := json.Marshal(info); err == nil {
		fmt.Println(string(b))
	} else {
		log.Printf("failed to marshal ws info: %v", err)
	}
}

func handleVideoChunk(data []byte) {
	if len(data) < 16 {
		log.Printf("Invalid packet size: %d", len(data))
		return
	}
	// timestamp := binary.LittleEndian.Uint64(data[0:8]) // 前8字节是时间戳
	// duration := binary.LittleEndian.Uint64(data[8:16]) // 接下来8字节是持续时间
	// log.Printf("Received video chunk: timestamp=%d, duration=%d", timestamp, duration)

	// 剩余的都是视频数据
	videoData := data[16:]

	for _, connection := range rtcManager.connections {
		videoTrack := connection.videoTrack

		videoTrack.WriteSample(media.Sample{
			Data:     videoData,
			Duration: time.Second / 30,
		})
	}
}

func handleMessage(data []byte) {
	log.Printf("Received text message: %s", string(data))

	var jsonData interface{}
	if err := json.Unmarshal(data, &jsonData); err != nil {
		log.Printf("Failed to decode JSON: %v", err)
	} else {
		log.Printf("Successfully decoded JSON: %+v", jsonData)
	}

}

func sendViaWS(data []byte) error {
	return nil
}
