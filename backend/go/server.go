package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/massalabs/station/int/config"
	sendOperation "github.com/massalabs/station/pkg/node/sendoperation"
	"github.com/massalabs/station/pkg/node/sendoperation/signer"
	"github.com/massalabs/station/pkg/onchain"
)

// ResetCounterHandler handles the reset endpoint
func ResetCounterHandler(w http.ResponseWriter, r *http.Request) {
	// Load environment variables
	err := godotenv.Load("../.env")
	if err != nil {
		http.Error(w, "Error loading .env file", http.StatusInternalServerError)
		log.Fatalf("Error loading .env file: %v", err)
		return
	}

	privateKey := os.Getenv("PRIVATE_KEY")
	if privateKey == "" {
		http.Error(w, "PRIVATE_KEY not set in .env file", http.StatusInternalServerError)
		log.Fatalf("PRIVATE_KEY not set in .env file")
		return
	}

	nickname := os.Getenv("NICKNAME")
	if nickname == "" {
		http.Error(w, "NICKNAME not set in .env file", http.StatusInternalServerError)
		log.Fatalf("NICKNAME not set in .env file")
		return
	}

	// Network configuration for Massa node
	networkInfos := &config.NetworkInfos{
		NodeURL: "https://buildnet.massa.net/api/v2", // Massa node URL
		ChainID: 77658366,                           // Chain ID
	}

	// Contract address
	contractAddress := "AS123fnc8H8MVMuiuaDiLkAeFGTobSjPvUEhJLtCjB8RQ5Dd1hkm"
	function := "reset" // Function to call in the contract
	parameter := []byte{} // No parameters for reset
	fee := uint64(1000000) // Operation fee
	maxGas := uint64(100000) // Maximum gas estimate
	coins := uint64(3100000000) // Amount of coins for the operation
	expiryDelta := uint64(1000) // Expiry time in seconds
	async := false // Synchronous mode

	// Signer configuration
	var signer signer.Signer = &signer.WalletPlugin{}
	operation := sendOperation.OperationBatch{NewBatch: false, CorrelationID: ""}

	// Calling the reset function on the smart contract
	opResponse, err := onchain.CallFunction(
		networkInfos,
		nickname,
		contractAddress,
		function,
		parameter,
		fee,
		maxGas,
		coins,
		expiryDelta,
		async,
		operation,
		signer,
		"Calling reset function",
	)
	if err != nil {
		http.Error(w, "Error calling reset function", http.StatusInternalServerError)
		log.Printf("Error calling reset function: %v", err)
		return
	}

	// Responding to the client with operation details
	log.Printf("Operation Response: %+v", opResponse.OperationResponse)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Counter reset successfully"))
}

func main() {
	// Start the HTTP server
	http.HandleFunc("/reset", ResetCounterHandler) // Reset counter endpoint

	// Start the server
	log.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
