package main

import (
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
)

func initHttpService(ln net.Listener, ready chan<- struct{}) {
	var err error
	var ip = nodeInfo.TailscaleIP

	mux := http.NewServeMux()

	corsHandler := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next(w, r)
		}
	}

	mux.HandleFunc("/", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(nodeInfo)
	}))

	mux.HandleFunc("/offer_ice", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("Error reading request body for /offer_ice: %v", err)

			http.Error(w, "Failed to read request body", http.StatusInternalServerError)
			return
		}
		defer r.Body.Close()

		var offerData HTTPpayload
		if err := json.Unmarshal(bodyBytes, &offerData); err != nil {
			log.Printf("Error parsing JSON from /offer_ice: %v", err)
			http.Error(w, "Failed to parse JSON", http.StatusBadRequest)
			return
		}
		// fmt.Printf("[HTTP] /offer_ice RECEIVED: %v\n", offerData)

		go rtcManager.createConnection(
			ANSWER,
			offerData.From,
			&offerData.SDPWithICE,
		)

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(""))
	}))

	mux.HandleFunc("/answer_ice", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("Error reading request body for /offer_ice: %v", err)
			http.Error(w, "Failed to read request body", http.StatusInternalServerError)
			return
		}
		defer r.Body.Close()

		var answerData HTTPpayload
		if err := json.Unmarshal(bodyBytes, &answerData); err != nil {
			log.Printf("Error parsing JSON from /answer_ice: %v", err)
			http.Error(w, "Failed to parse JSON", http.StatusBadRequest)
			return
		}
		// fmt.Printf("[HTTP] /answer_ice RECEIVED: %v\n", answerData)

		go func() {
			if err := rtcManager.HandleAnswer(answerData.From, &answerData.SDPWithICE); err != nil {
				log.Printf("Error handling answer for %s: %v", answerData.From, err)
				http.Error(w, "Failed to handle answer", http.StatusInternalServerError)
				return
			}
		}()

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(""))
	}))

	log.Printf("HTTP server starting on %s (%s:%s)", ln.Addr().String(), ip, tcpPort)

	// 在goroutine中启动HTTP服务器，并在成功启动后发送ready信号
	go func() {
		err = http.Serve(ln, mux)
		if err != nil && err != http.ErrServerClosed {
			log.Printf("HTTP server on %s:%s encountered an error: %v", ip, tcpPort, err)
		}
		log.Printf("HTTP server on %s:%s has shut down.", ip, tcpPort)
	}()

	if ready != nil {
		close(ready)
	}
}
