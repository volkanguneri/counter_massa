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

	// Check if loaded privateKey and nickname
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
		NodeURL: "https://test.massa.net/api/v2:33035", 
		ChainID: 77658366,                           
	}

	// Contract and function information
	contractAddress := "AS12b4pgVgvF9GKL6S8wZ6AEKENeqihZ8Qmxkr5NT4Ho7wYp9D9NT"
	function := "reset" // Function to call in the contract
	parameter := []byte{} // No parameters for reset

	// 1 Massa = 1_000_000_000 
	fee := uint64(1_000_000) // Operation fee 0.001
	maxGas := uint64(100_000) // Maximum gas estimate
	coins := uint64(4_000_000_000) // Amount of coins for the operation 3.1
	expiryDelta := uint64(1000) // Expiry time in seconds

	// Synchronous mode waits for bot only response but also events
	async := false  

	// Signer setup
	var signer signer.Signer = &signer.WalletPlugin{}

	// New operation batches
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
