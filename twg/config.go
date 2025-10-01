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
func InitConfig() (string, string, string, string, bool) {
	// Define command-line flags
	cliHostnamePtr := flag.String("hostname", "", "Node hostname")
	cliAuthKeyPtr := flag.String("authkey", "", "Tailscale auth key")
	cliEnvFilePtr := flag.String("env", "", "Path to .env file (e.g., .env.dev)")
	cliControlURLPtr := flag.String("controlurl", "", "Tailscale control server URL")
	cliDirPathPtr := flag.String("dirpath", "", "Path to directory")
	cliEphemeralPtr := flag.Bool("ephemeral", false, "Run Tailscale node in ephemeral mode")
	flag.Parse()

	// Load .env file only if explicitly specified
	if *cliEnvFilePtr != "" {
		envFilePath := *cliEnvFilePtr
		log.Printf("Using .env file specified by --env flag: %s", envFilePath)

		err := godotenv.Load(envFilePath)
		if err != nil {
			log.Printf("Error loading specified .env file '%s': %v", envFilePath, err)
		} else {
			log.Printf("Successfully loaded environment variables from: %s", envFilePath)
		}
	} else {
		log.Printf("No .env file specified via --env flag, using existing environment variables")
	}

	var finalHostname string
	var finalAuthKey string
	var finalControlURL string
	var finalDirPath string

	// Hostname
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

	// Auth Key
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

	// Control URL
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

	// Directory Path
	if *cliDirPathPtr != "" {
		finalDirPath = *cliDirPathPtr
		log.Printf("Using directory path from --dirpath flag: %s", finalDirPath)
	} else {
		finalDirPath = "tsNodeDir" // Default path
		log.Printf("Using default directory path: %s", finalDirPath)
	}

	// Validation
	if finalHostname == "" {
		osHostname, err := os.Hostname()
		if err != nil {
			log.Printf("Error retrieving system hostname: %v", err)
		}
		finalHostname = "relayx-" + osHostname
		log.Printf("Hostname is not provided. Using default hostname: %s", finalHostname)
	}
	if finalAuthKey == "" {
		log.Printf("Auth key is not provided. Using account login method.")
	}
	log.Printf("Final Configuration: \nHostname=%s, \nControlURL=%s, \nDirPath=%s, \nAuthKey Provided=%t\n", finalHostname, finalControlURL, finalDirPath, finalAuthKey != "")

	return finalHostname, finalControlURL, finalAuthKey, finalDirPath, *cliEphemeralPtr
}
