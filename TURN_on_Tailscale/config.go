package main

import (
	"flag"
	"log"
	"os"

	"github.com/joho/godotenv"
)

// InitConfig initializes and returns configuration parameters: hostname, controlURL, authKey, and dirPath.
// The order of precedence for hostname and authKey is: command-line flag > environment variable.
// The controlURL is sourced from an environment variable.
// The .env file path can be specified via a command-line flag.
func InitConfig() (string, string, string, string) {
	// Define command-line flags
	cliHostnamePtr := flag.String("hostname", "", "Node hostname")
	cliAuthKeyPtr := flag.String("authkey", "", "Tailscale auth key")
	cliEnvFilePtr := flag.String("env", "", "Path to .env file (e.g., .env.dev)")
	cliControlURLPtr := flag.String("controlurl", "", "Tailscale control server URL")
	cliDirPathPtr := flag.String("dirpath", "", "Path to directory")
	flag.Parse()

	// Determine and load .env file
	envFilePath := ".env" // Default .env file
	if *cliEnvFilePtr != "" {
		envFilePath = *cliEnvFilePtr
		log.Printf("Using .env file specified by --env flag: %s", envFilePath)
	} else {
		log.Printf("Attempting to load default .env file: %s", envFilePath)
	}

	err := godotenv.Load(envFilePath)
	if err != nil {
		// If the default .env file is not found, it might not be an error if all configs are from flags/env vars.
		// However, if a specific file was requested and not found, it's more likely an error.
		// For simplicity here, we'll log a warning but not panic if the file doesn't exist,
		// as critical values might be supplied by flags or existing environment variables.
		log.Printf("Warning: Error loading '%s' file: %v. Proceeding with existing environment variables and flags.", envFilePath, err)
	} else {
		log.Printf("Successfully loaded environment variables from: %s", envFilePath)
	}

	var finalHostname string
	var finalAuthKey string
	var finalControlURL string
	var finalDirPath string

	// 1. Determine Hostname
	if *cliHostnamePtr != "" {
		finalHostname = *cliHostnamePtr
		log.Printf("Using hostname from --hostname flag: %s", finalHostname)
	} else {
		envHostname := os.Getenv("NODE_HOSTNAME")
		if envHostname != "" {
			finalHostname = envHostname
			log.Printf("Using hostname from NODE_HOSTNAME environment variable: %s", finalHostname)
		} else {
			log.Println("Hostname not provided by --hostname flag or NODE_HOSTNAME environment variable.")
		}
	}

	// 2. Determine Auth Key
	if *cliAuthKeyPtr != "" {
		finalAuthKey = *cliAuthKeyPtr
		// Avoid logging the full auth key for security. Log its presence/source.
		log.Printf("Using auth key from --authkey flag.")
	} else {
		envAuthKey := os.Getenv("TAILSCALE_AUTH_KEY")
		log.Printf("envAuthKey: %s", envAuthKey)
		if envAuthKey != "" {
			finalAuthKey = envAuthKey
			log.Printf("Using auth key from TAILSCALE_AUTH_KEY environment variable.")
		} else {
			log.Println("Auth key not provided by --authkey flag or TAILSCALE_AUTH_KEY environment variable.")
		}
	}

	// 3. Determine Control URL
	// Control URL is expected to be set in the environment (either system or via .env file)
	if *cliControlURLPtr != "" {
		finalControlURL = *cliControlURLPtr
		log.Printf("Using control URL from --controlurl flag: %s", finalControlURL)
	} else {
		envControlURL := os.Getenv("CONTROL_URL")
		if envControlURL != "" {
			finalControlURL = envControlURL
			log.Printf("Using control URL from CONTROL_URL environment variable: %s", finalControlURL)
		} else {
			log.Printf("Control URL not provided by flag or environment variable; will use default (empty or server-defined).")
		}
	}

	// 4. Determine Directory Path
	if *cliDirPathPtr != "" {
		finalDirPath = *cliDirPathPtr
		log.Printf("Using directory path from --dirpath flag: %s", finalDirPath)
	} else {
		finalDirPath = "tsNodeDir" // 默认路径
		log.Printf("Using default directory path: %s", finalDirPath)
	}

	// Validation
	if finalHostname == "" {
		panic("Error: Hostname is required but was not provided by --hostname flag or NODE_HOSTNAME environment variable. Quitting.")
	}
	if finalAuthKey == "" {
		panic("Error: Auth key is required but was not provided by --authkey flag or TAILSCALE_AUTH_KEY environment variable. Quitting.")
	}
	log.Printf("Final Configuration: Hostname=%s, ControlURL=%s, DirPath=%s, AuthKey Provided=%t", finalHostname, finalControlURL, finalDirPath, finalAuthKey != "")

	return finalHostname, finalControlURL, finalAuthKey, finalDirPath
}
