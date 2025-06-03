package main

import (
	"encoding/json"
	"fmt"
	"strings"

	// "github.com/pion/webrtc/v4"
	"io"
	"log"
	"net"
	"net/http"

	// "tailscale.com/tsnet"
)

func SetupHttpService(ip string) {
	var ln net.Listener
	var err error
	if HTTP_ON_ALL_IPS {
		ln, err = server.Listen("tcp", ":8848")
		if err != nil {
			log.Printf("Error listening on :8848: %v", err)
			return
		}
	} else {
		ln, err = server.Listen("tcp4", ip+":8848")
		if err != nil {
			log.Printf("Error listening on %s:8848: %v", ip, err)
			return
		}
	}

	listener = ln

	mux := http.NewServeMux()

	corsHandler := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Peer-IP")

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
			// Inform Electron about the error
			fmt.Printf("{\"type\":\"error\", \"source\":\"httpService/offer_ice\", \"reason\":\"Failed to read request body\", \"details\":\"%v\"}\n", err)
			http.Error(w, "Failed to read request body", http.StatusInternalServerError)
			return
		}
		defer r.Body.Close()

		bodyString := string(bodyBytes)

		// Directly replace the type string.
		modifiedBodyString := strings.Replace(bodyString, "\"type\":\"offer\"", "\"type\":\"http/offer_ice\"", 1)

		if modifiedBodyString == bodyString {
			log.Printf("Warning: 'type':'offer' not found in /offer_ice request body. Body: %s", bodyString)
			fmt.Printf("{\"type\":\"warning\", \"source\":\"httpService/offer_ice\", \"reason\":\"'type':'offer' not found, original message passed through\", \"original_body\":%s}\n", bodyString) // Attempt to embed original as JSON
		}

		fmt.Printf("%s\n", modifiedBodyString)

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(""))
	}))

	mux.HandleFunc("/answer_ice", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("Error reading request body for /offer_ice: %v", err)
			// Inform Electron about the error
			fmt.Printf("{\"type\":\"error\", \"source\":\"httpService/offer_ice\", \"reason\":\"Failed to read request body\", \"details\":\"%v\"}\n", err)
			http.Error(w, "Failed to read request body", http.StatusInternalServerError)
			return
		}
		defer r.Body.Close()

		bodyString := string(bodyBytes)

		// Directly replace the type string.
		modifiedBodyString := strings.Replace(bodyString, "\"type\":\"answer\"", "\"type\":\"http/answer_ice\"", 1)

		if modifiedBodyString == bodyString {
			log.Printf("Warning: 'type':'answer' not found in /answer_ice request body. Body: %s", bodyString)
			fmt.Printf("{\"type\":\"warning\", \"source\":\"httpService/answer_ice\", \"reason\":\"'type':'answer' not found, original message passed through\", \"original_body\":%s}\n", bodyString) // Attempt to embed original as JSON
		}

		fmt.Printf("%s\n", modifiedBodyString)

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(""))
	}))

	log.Printf("HTTP server starting on %s (%s:8848)", listener.Addr().String(), ip)
	err = http.Serve(listener, mux)
	if err != nil && err != http.ErrServerClosed {
		log.Printf("HTTP server on %s:8848 encountered an error: %v", ip, err)
	}
	log.Printf("HTTP server on %s:8848 has shut down.", ip)
}
