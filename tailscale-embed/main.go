package main

// #include <stdlib.h>
// typedef void (*ws_message_callback)(const char* from, const char* message, int type);
// static void bridge_ws_callback(ws_message_callback cb, const char* from, const char* message, int type) {
//     cb(from, message, type);
// }
// typedef void (*http_message_callback)(const char* from, const char* message);
// static void bridge_http_callback(http_message_callback cb, const char* from, const char* message) {
//     cb(from, message);
// }
import "C"
import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/gorilla/websocket"
	// "html"
	"io"
	"log"
	"math"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"tailscale.com/client/tailscale"
	"tailscale.com/tsnet"
	"time"
	"unsafe"
)

var (
	localClient *tailscale.LocalClient
	lcMutex     sync.RWMutex
	server      *tsnet.Server
	upgrader    = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	proxyMux      = http.NewServeMux()
	wsConnections = struct {
		sync.RWMutex
		conns map[string]*websocket.Conn
		users map[string]string // 存储 IP 到用户名的映射
	}{
		conns: make(map[string]*websocket.Conn),
		users: make(map[string]string),
	}
	wsCallback   C.ws_message_callback
	httpCallback C.http_message_callback
	serverUUID   string
)

func main() {}

//export RegisterWSCallback
func RegisterWSCallback(callback C.ws_message_callback) {
	wsCallback = callback
}

//export RegisterHTTPCallback
func RegisterHTTPCallback(callback C.http_message_callback) {
	httpCallback = callback
}

//export startTailscale
func startTailscale(authkey *C.char, hostname *C.char, uuid *C.char, controlURL *C.char) {
	os.Setenv("TSNET_FORCE_LOGIN", "1")

	serverUUID = C.GoString(uuid)
	
	go startLocalProxy()

	go func() {
		flag.Parse()
		srv := new(tsnet.Server)
		server = srv
		srv.Ephemeral = true
		srv.AuthKey = C.GoString(authkey)
		// srv.Dir = "tailscale-embed"
		srv.Hostname = C.GoString(hostname)
		
		if controlURL != nil {
			urlStr := C.GoString(controlURL)
			if urlStr != "" {
				srv.ControlURL = urlStr
			}
		}
		defer srv.Close()

		// 监听所有 IPv4 地址的 8848 端口
		ln, err := srv.Listen("tcp4", ":8848")
		if err != nil {
			log.Fatal(err)
			return
		}
		defer ln.Close()

		// local client
		lc, err := srv.LocalClient()
		if err != nil {
			log.Fatal(err)
		}

		lcMutex.Lock()
		localClient = lc
		lcMutex.Unlock()

		// 创建一个新的 mux 来处理所有请求
		mux := http.NewServeMux()

		corsHandler := func(next http.HandlerFunc) http.HandlerFunc {
			return func(w http.ResponseWriter, r *http.Request) {
				// 设置CORS headers
				w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

				// 处理 OPTIONS 预检请求
				if r.Method == "OPTIONS" {
					w.WriteHeader(http.StatusOK)
					return
				}

				next(w, r)
			}
		}

		mux.HandleFunc("/ws", corsHandler(func(w http.ResponseWriter, r *http.Request) {
			conn, err := upgrader.Upgrade(w, r, nil)
			if err != nil {
				log.Printf("Websocket upgrade failed: %v", err)
				return
			}

			// 获取连接用户信息
			clientIP := strings.Split(r.RemoteAddr, ":")[0]
			who, err := lc.WhoIs(r.Context(), clientIP)
			if err != nil {
				conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("Error: %v", err)))
				return
			}

			// 保存连接
			wsConnections.Lock()
			if oldConn, exists := wsConnections.conns[clientIP]; exists {
				oldConn.Close() // 关闭旧连接
			}
			wsConnections.conns[clientIP] = conn
			wsConnections.users[clientIP] = who.UserProfile.LoginName
			wsConnections.Unlock()

			// clean up
			defer func() {
				conn.Close()
				wsConnections.Lock()
				delete(wsConnections.conns, clientIP)
				delete(wsConnections.users, clientIP)
				wsConnections.Unlock()
			}()

			for {
				messageType, message, err := conn.ReadMessage()
				if err != nil {
					log.Printf("Websocket read error: %v", err)
					break
				}

				// log.Printf("ws received message: %s", message)

				// respone {type:ping} message
				var msgData struct {
					Type string `json:"type"`
				}
				if err := json.Unmarshal(message, &msgData); err == nil && msgData.Type == "ping" {
					response := struct {
						Type string `json:"type"`
					}{
						Type: "pong",
					}
					responseBytes, err := json.Marshal(response)
					if err == nil {
						if err := conn.WriteMessage(messageType, responseBytes); err != nil {
							log.Printf("Error sending pong: %v", err)
						}
					}
					continue // 跳过回调
				}

				// echo message
				// err = conn.WriteMessage(messageType, []byte(fmt.Sprintf("Echo: %s", message)))
				// if err != nil {
				// 	log.Printf("Websocket write error: %v", err)
				// 	break
				// }

				if wsCallback != nil {
					from := C.CString(clientIP)
					msg := C.CString(string(message))
					// 通过C桥接函数调用回调
					C.bridge_ws_callback(wsCallback, from, msg, C.int(messageType))
					// 释放内存
					C.free(unsafe.Pointer(from))
					C.free(unsafe.Pointer(msg))
				}
			}
		}))

		mux.HandleFunc("/RTC", corsHandler(func(w http.ResponseWriter, r *http.Request) {
			who, err := lc.WhoIs(r.Context(), r.RemoteAddr)
			if err != nil {
				http.Error(w, err.Error(), 500)
				return
			}

			switch r.Method {
			case "GET":
				fmt.Fprintf(w, "Hello %s from %s (%s)",
					who.UserProfile.LoginName,
					firstLabel(who.Node.ComputedName),
					r.RemoteAddr)

			case "POST":
				body, err := io.ReadAll(r.Body)
				if err != nil {
					http.Error(w, "读取请求内容失败", 500)
					return
				}
				defer r.Body.Close()

				var message struct {
					Type string `json:"type"`
				}
				if err := json.Unmarshal(body, &message); err != nil {
					http.Error(w, "在 /RTC 中解析 JSON 失败", 400)
					return
				}

				if message.Type == "uuid" {
					response := struct {
						Type string `json:"type"`
						UUID string `json:"uuid"`
					}{
						Type: "uuid",
						UUID: serverUUID,
					}
					json.NewEncoder(w).Encode(response)
					// return
				}

				// fmt.Fprintf(w, "Received from %s: %s",
				// 	who.UserProfile.LoginName,
				// 	string(body))

				if httpCallback != nil {
					from := C.CString(r.RemoteAddr)
					msg := C.CString(string(body))
					C.bridge_http_callback(httpCallback, from, msg)
					C.free(unsafe.Pointer(from))
					C.free(unsafe.Pointer(msg))
				}

			default:
				http.Error(w, "仅支持 GET 和 POST 方法", 405)
			}
		}))

		log.Fatal(http.Serve(ln, mux))

	}()
}

func firstLabel(s string) string {
	s, _, _ = strings.Cut(s, ".")
	return s
}

//export getWSConnections
func getWSConnections() *C.char {
	type ConnectionInfo struct {
		IP       string `json:"ip"`
		Username string `json:"username"`
		Active   bool   `json:"active"`
	}

	wsConnections.RLock()
	defer wsConnections.RUnlock()

	connections := make([]ConnectionInfo, 0)
	for ip, conn := range wsConnections.conns {
		// 测试连接是否活跃
		err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(time.Second))
		active := err == nil

		connections = append(connections, ConnectionInfo{
			IP:       ip,
			Username: wsConnections.users[ip],
			Active:   active,
		})
	}

	jsonBytes, err := json.Marshal(connections)
	if err != nil {
		return C.CString(fmt.Sprintf(`{"error":"JSON marshal error: %v"}`, err))
	}

	return C.CString(string(jsonBytes))
}

//export sendMessageToClient
func sendMessageToClient(ip *C.char, message *C.char) *C.char {
	clientIP := C.GoString(ip)
	msg := C.GoString(message)

	wsConnections.RLock()
	conn, exists := wsConnections.conns[clientIP]
	wsConnections.RUnlock()

	if !exists {
		return C.CString(fmt.Sprintf(`{"error":"No connection found for IP: %s"}`, clientIP))
	}

	err := conn.WriteMessage(websocket.TextMessage, []byte(msg))
	if err != nil {
		return C.CString(fmt.Sprintf(`{"error":"Failed to send message: %v"}`, err))
	}

	return C.CString(`{"status":"success"}`)
}

//export getLocalClientStatus
func getLocalClientStatus() *C.char {
	lcMutex.RLock()
	if localClient == nil {
		lcMutex.RUnlock()
		return C.CString(`{"error":"LocalClient not initialized"}`)
	}
	lc := localClient
	lcMutex.RUnlock()

	status, err := lc.Status(context.Background())
	if err != nil {
		return C.CString(fmt.Sprintf(`{"error":"%s"}`, err.Error()))
	}

	jsonBytes, err := json.Marshal(status)
	if err != nil {
		return C.CString(fmt.Sprintf(`{"error":"JSON marshal error: %v"}`, err))
	}

	return C.CString(string(jsonBytes))
}

// 代理服务器管理器
type proxyServerManager struct {
	sync.RWMutex
	servers map[string]*wsProxyServer // key: targetHost
}

type wsProxyServer struct {
	targetHost string
	upgrader   websocket.Upgrader
	dialer     websocket.Dialer
	maxRetries int
	retryDelay time.Duration
}

var manager = &proxyServerManager{
	servers: make(map[string]*wsProxyServer),
}

func startLocalProxy() {
	/*
		proxyMux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
			// 处理CORS
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			targetHost := r.URL.Query().Get("target")
			if targetHost == "" {
				http.Error(w, "missing target parameter", http.StatusBadRequest)
				return
			}
			if !strings.Contains(targetHost, ":") {
				http.Error(w, "invalid target format, must include port", http.StatusBadRequest)
				return
			}

			targetWsURL := fmt.Sprintf("ws://%s", targetHost)
			if r.URL.RawQuery != "" {
				q := r.URL.Query()
				q.Del("target")
				if len(q) > 0 {
					targetWsURL += "?" + q.Encode()
				}
			}
			// 设置连接超时
			ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
			r = r.WithContext(ctx)
			defer cancel()
			// 先连接到目标WebSocket服务器
			dialer := websocket.Dialer{
				NetDial: func(network, addr string) (net.Conn, error) {
					log.Printf("尝试通过tailscale连接到: %s", addr)
					return server.Dial(r.Context(), "tcp", addr)
				},
			}

			header := http.Header{}
			// no copy any header

			targetConn, resp, err := dialer.Dial(targetWsURL, header)
			if err != nil {
				log.Printf("连接目标WebSocket失败: %v", err)
				if resp != nil {
					log.Printf("目标服务器响应: %d", resp.StatusCode)
				}
				// 在升级连接之前返回错误
				http.Error(w, fmt.Sprintf("连接目标WebSocket失败: %v", err), http.StatusBadGateway)
				return
			}
			defer targetConn.Close()
			log.Printf("成功连接到目标WebSocket服务器")

			// 只有在成功连接到目标服务器后才升级客户端连接
			clientConn, err := upgrader.Upgrade(w, r, nil)
			if err != nil {
				log.Printf("升级WebSocket连接失败: %v", err)
				return
			}
			defer clientConn.Close()
			log.Printf("客户端WebSocket连接已升级")

			// 创建双向转发
			errChan := make(chan error, 2)

			// 客户端 -> 目标服务器
			go func() {
				for {
					messageType, message, err := clientConn.ReadMessage()
					if err != nil {
						errChan <- fmt.Errorf("读取客户端消息失败: %v", err)
						return
					}
					if err := targetConn.WriteMessage(messageType, message); err != nil {
						errChan <- fmt.Errorf("发送消息到目标服务器失败: %v", err)
						return
					}
				}
			}()

			// 目标服务器 -> 客户端
			go func() {
				for {
					messageType, message, err := targetConn.ReadMessage()
					if err != nil {
						errChan <- fmt.Errorf("读取目标服务器消息失败: %v", err)
						return
					}
					if err := clientConn.WriteMessage(messageType, message); err != nil {
						errChan <- fmt.Errorf("发送消息到客户端失败: %v", err)
						return
					}
				}
			}()

			// 等待任一方向出错
			err = <-errChan
			log.Printf("WebSocket连接关闭: %v", err)
		})
	*/
	proxyMux.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		// 先设置 CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// 处理 OPTIONS 预检请求
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != "POST" {
			http.Error(w, "仅支持 POST 方法", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			TargetHost string `json:"targetHost"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "无效的请求体", http.StatusBadRequest)
			return
		}

		if req.TargetHost == "" {
			http.Error(w, "targetHost 不能为空", http.StatusBadRequest)
			return
		}

		manager.getOrCreateServer(req.TargetHost)
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "/proxy/%s/ws", req.TargetHost)
		log.Printf("register proxy server for targetHost: %s", req.TargetHost)
	})

	proxyMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// 处理 CORS 预检请求
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusOK)
			return
		}

		// 从查询参数获取目标地址
		targetHost := r.URL.Query().Get("target")
		if targetHost == "" {
			http.Error(w, "missing target parameter", http.StatusBadRequest)
			return
		}

		// 构建目标 URL，移除开头的斜杠以避免双斜杠
		path := r.URL.Path
		if path == "/" {
			path = ""
		}

		// 构建目标 URL
		targetURL := fmt.Sprintf("http://%s", targetHost)
		if r.URL.RawQuery != "" {
			// 移除 target 参数
			q := r.URL.Query()
			q.Del("target")
			if len(q) > 0 {
				targetURL += "?" + q.Encode()
			}
		}

		log.Printf("local proxy http request targetURL: %s", targetURL)

		client := &http.Client{
			Transport: &http.Transport{
				DialContext: server.Dial,
			},
		}

		// 创建新的请求
		proxyReq, err := http.NewRequestWithContext(r.Context(), r.Method, targetURL, r.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("创建代理请求失败: %v", err), http.StatusInternalServerError)
			return
		}

		// 复制原始请求的 header
		for key, values := range r.Header {
			if key != "Host" { // 不复制 Host header
				for _, value := range values {
					proxyReq.Header.Add(key, value)
				}
			}
		}

		// 发送请求
		resp, err := client.Do(proxyReq)
		if err != nil {
			http.Error(w, fmt.Sprintf("代理请求失败: %v", err), http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		// 复制响应 header
		for key, values := range resp.Header {
			for _, value := range values {
				w.Header().Add(key, value)
			}
		}

		// 设置响应状态码
		w.WriteHeader(resp.StatusCode)

		// 复制响应体
		io.Copy(w, resp.Body)
	})

	log.Printf("Starting local proxy server on :8849")
	if err := http.ListenAndServe(":8849", proxyMux); err != nil {
		log.Printf("Local proxy server error: %v", err)
	}
}

func proxyWebSocket(src, dst *websocket.Conn, errChan chan error, direction string, ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			messageType, message, err := src.ReadMessage()
			if err != nil {
				errChan <- fmt.Errorf("%s: 读取消息失败: %v", direction, err)
				return
			}

			err = dst.WriteMessage(messageType, message)
			if err != nil {
				errChan <- fmt.Errorf("%s: 写入消息失败: %v", direction, err)
				return
			}
		}
	}
}

func (s *wsProxyServer) dialWithRetry(ctx context.Context) (*websocket.Conn, error) {
	targetWsURL := fmt.Sprintf("ws://%s/ws", s.targetHost)
	var lastErr error

	for i := 0; i < s.maxRetries; i++ {
		if i > 0 {
			time.Sleep(s.retryDelay)
			log.Printf("正在进行第 %d 次重试连接 %s", i, s.targetHost)
		}
		if i == 0 {
			log.Printf("第一次连接 %s", s.targetHost)
		}

		// 为每次连接尝试创建新的 context
		dialCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

		dialer := s.dialer
		dialer.NetDial = func(network, addr string) (net.Conn, error) {
			return server.Dial(dialCtx, "tcp", addr)
		}

		conn, _, err := dialer.DialContext(dialCtx, targetWsURL, nil)
		cancel() // 及时释放 context

		if err == nil {
			return conn, nil
		}

		lastErr = err
		log.Printf("连接失败 %s: %v", s.targetHost, err)

		// 检查父 context 是否被取消（用于完全停止重试）
		select {
		case <-ctx.Done():
			log.Printf("父 context 已取消，但继续重试连接 %s", s.targetHost)
		default:
		}
	}

	return nil, lastErr
}

func (m *proxyServerManager) getOrCreateServer(targetHost string) *wsProxyServer {
	m.Lock()
	defer m.Unlock()
	/*
		if server, exists := m.servers[targetHost]; exists {
			return server
		}
		server := &wsProxyServer{
			targetHost: targetHost,
			upgrader: websocket.Upgrader{
				CheckOrigin: func(r *http.Request) bool {
					return true
				},
			},
			dialer: websocket.Dialer{
				NetDial: func(network, addr string) (net.Conn, error) {
					return server.Dial(context.Background(), "tcp", addr)
				},
				// HandshakeTimeout: 5 * time.Second,
			},
		}

		// 创建专用的处理路由
		proxyMux.HandleFunc(fmt.Sprintf("/proxy/%s/ws", targetHost), server.handleConnection)
		m.servers[targetHost] = server
		return server
	*/
	server := &wsProxyServer{
		targetHost: targetHost,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		dialer: websocket.Dialer{
			NetDial: func(network, addr string) (net.Conn, error) {
				return server.Dial(context.Background(), "tcp", addr) // will be replaced in handleConnection
			},
			HandshakeTimeout: 5 * time.Second,
		},
		maxRetries: math.MaxInt, // infinite retries
		retryDelay: 5 * time.Second,
	}

	// 如果已存在相同路由，重新创建 mux
	if _, exists := m.servers[targetHost]; exists {
		// 创建新的 mux
		newMux := http.NewServeMux()

		// 重新注册所有其他路由（除了要替换的那个）
		for host, srv := range m.servers {
			if host != targetHost {
				newMux.HandleFunc(fmt.Sprintf("/proxy/%s/ws", host), srv.handleConnection)
			}
		}

		// 替换全局的 proxyMux
		proxyMux = newMux

		delete(m.servers, targetHost)
	}

	// 注册新的路由
	proxyMux.HandleFunc(fmt.Sprintf("/proxy/%s/ws", targetHost), server.handleConnection)
	m.servers[targetHost] = server
	return server
}

func (s *wsProxyServer) handleConnection(w http.ResponseWriter, r *http.Request) {
	// CORS headers 设置
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// 升级客户端连接（只需要做一次）
	clientConn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("升级客户端连接失败: %v", err)
		return
	}
	defer clientConn.Close()

	// 创建用于整个连接生命周期的 context
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	for {
		// 创建一个 channel 来接收连接结果
		type dialResult struct {
			conn *websocket.Conn
			err  error
		}
		resultChan := make(chan dialResult)

		// 在 goroutine 中进行连接
		go func() {
			conn, err := s.dialWithRetry(ctx)
			resultChan <- dialResult{conn, err}
		}()

		// 等待连接完成
		select {
		case <-ctx.Done():
			return
		case result := <-resultChan:
			if result.err != nil {
				// 连接失败，继续重试
				continue
			}
			targetConn := result.conn
			defer targetConn.Close()

			// 创建双向数据转发
			errChan := make(chan error, 2)
			go proxyWebSocket(clientConn, targetConn, errChan, "client->target", ctx)
			go proxyWebSocket(targetConn, clientConn, errChan, "target->client", ctx)

			// 等待任一方向出错
			err = <-errChan
			log.Printf("WebSocket连接关闭: %v", err)
			// 继续外层循环，重新建立连接
		}
	}
}
