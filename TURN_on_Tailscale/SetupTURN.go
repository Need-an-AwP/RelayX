package main

import (
	"errors"
	"fmt"
	"github.com/pion/turn/v4"
	"log"
	"net"
	// "github.com/pion/logging"
	"sync"
	// "tailscale.com/tsnet"
	// "os"
)

var (
	turnServer *turn.Server
	turnMutex  sync.Mutex
)

const (
	turnUsername = "user" // 硬编码用户名
	turnPassword = "pass" // 硬编码密码
	turnRealm    = "tailscale.turn"
)

// findAvailablePort 从 startPort 开始查找一个可用的UDP端口
func findAvailablePort(connType string, listenIP string, startPort int) (net.PacketConn, int, error) {
	for port := startPort; port < startPort+100; port++ {
		listenAddrStr := fmt.Sprintf("%s:%d", listenIP, port)
		var conn net.PacketConn
		var err error
		if connType == "os" {
			conn, err = net.ListenPacket("udp4", listenAddrStr)
		} else if connType == "ts" {
			conn, err = server.ListenPacket("udp", listenAddrStr)
		}
		if err == nil {
			// 端口可用
			return conn, port, nil
		}
	}
	return nil, 0, errors.New("no suitable UDP port found")
}

func getLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "127.0.0.1"
	}
	defer conn.Close()
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

func SetupTURN(tailscaleIP string) (string, int, error) {
	turnMutex.Lock()
	defer turnMutex.Unlock()

	if turnServer != nil {
		log.Println("TURN server is already initialized. Please close it first if you want to reinitialize.")
		return "", 0, errors.New("TURN server is already initialized")
	}

	localIP := getLocalIP()

	tsConn, tsListeningPort, err := findAvailablePort("ts", tailscaleIP, 34789)
	_ = tsListeningPort
	if err != nil {
		log.Printf("Failed to find an available UDP port for TURN server: %v", err)
		return "", 0, err
	}
	osConn, osListeningPort, err := findAvailablePort("os", localIP, 34780)
	if err != nil {
		log.Printf("Failed to find an available UDP port for TURN server: %v", err)
		return "", 0, err
	}
	log.Printf("TURN server will listen on %s:%d", localIP, osListeningPort)

	// 使用硬编码的用户名和密码
	usersMap := map[string][]byte{
		turnUsername: turn.GenerateAuthKey(turnUsername, turnRealm, turnPassword),
	}

	var errServer error
	// 将 server 赋值给全局变量 turnServer
	turnServer, errServer = turn.NewServer(turn.ServerConfig{
		Realm: turnRealm,
		AuthHandler: func(username string, realm string, srcAddr net.Addr) ([]byte, bool) {
			if key, ok := usersMap[username]; ok {
				// if realm != turnRealm {
				//    log.Printf("Realm mismatch for user %s: expected %s, got %s", username, turnRealm, realm)
				//	  return nil, false
				// }
				return key, true
			}
			log.Printf("TURN authentication failed for user: %s, realm: %s from %s", username, realm, srcAddr.String())
			return nil, false
		},
		PacketConnConfigs: []turn.PacketConnConfig{
			{
				PacketConn: osConn,
				RelayAddressGenerator: &turn.RelayAddressGeneratorStatic{
					RelayAddress: net.ParseIP(localIP), // 宣告 Tailscale IP
					Address:      localIP,
				},
			},
			{
				PacketConn: tsConn,
				RelayAddressGenerator: &turn.RelayAddressGeneratorStatic{
					RelayAddress: net.ParseIP(tailscaleIP), // 宣告 Tailscale IP
					Address:      tailscaleIP,
				},
			},
		},
		// LoggerFactory: ,
	})

	if errServer != nil {
		log.Printf("Failed to create TURN server: %v", errServer)
		tsConn.Close()   // 如果服务器创建失败，关闭监听器
		turnServer = nil // 确保全局变量被重置
		return "", 0, errServer
	}

	log.Printf("TURN server created successfully. Listening on %s:%d", localIP, osListeningPort)
	fmt.Printf(`{"type":"TURNinfo","ip":"%s","port":%d,"realm":"%s","username":"%s","password":"%s"}`+"\n",
		localIP, osListeningPort, turnRealm, turnUsername, turnPassword)
	return localIP, osListeningPort, nil
}

// CloseTURNServer 优雅地关闭TURN服务器
func CloseTURNServer() error {
	turnMutex.Lock()
	defer turnMutex.Unlock()

	if turnServer != nil {
		log.Println("Closing TURN server...")
		err := turnServer.Close()
		turnServer = nil // 重置全局变量，允许重新初始化
		if err != nil {
			log.Printf("Error closing TURN server: %v", err)
			return err
		}
		log.Println("TURN server closed.")
		return nil
	}
	log.Println("CloseTURNServer called but TURN server was not running.")
	return nil
}
