package main

import (
	"log"

	"os"

	"github.com/joho/godotenv"
	"github.com/massalabs/station/int/config"
	"github.com/massalabs/station/pkg/node"
	sendOperation "github.com/massalabs/station/pkg/node/sendoperation"
	"github.com/massalabs/station/pkg/node/sendoperation/signer"
	"github.com/massalabs/station/pkg/onchain"
)

// :::::::::::::::::::::::::::::event response::::::::::::::::::::::::::::::::::::::::::

type OperationWithEventResponse struct {
	Event             string
	OperationResponse sendOperation.OperationResponse
}

// ::::::::::::::::::::::::::::::::signer:::::::::::::::::::::::::::::::::::::::::::::::::

//nolint:tagliatelle
type SignOperationResponse struct {
	PublicKey     string `json:"publicKey"`
	Signature     string `json:"signature"`
	CorrelationID string `json:"correlationId,omitempty"`
	Operation     string `json:"operation,omitempty"`
}

type Signer interface {
	Sign(nickname string, operation []byte) (*SignOperationResponse, error)
}

// ::::::::::::::::::::::::::::::main::::::::::::::::::::::::::::::::::::::::::::::::::::::

func main() {
	// Load environment variables
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}
	log.Println("Loaded .env file")

	privateKey := os.Getenv("PRIVATE_KEY")
	if privateKey == "" {
		log.Fatalf("PRIVATE_KEY not set in .env file")
	}
	log.Println("Private key loaded from .env")

	nickname := os.Getenv("NICKNAME")
	if nickname == "" {
		log.Fatalf("NICKNAME not set in .env file")
	}
	log.Println("Nickname loaded from .env")

	// Network configuration for Massa node
	networkInfos := &config.NetworkInfos{
		NodeURL: "https://buildnet.massa.net/api/v2", 
		ChainID: 77658366,             
	}
	
	log.Printf("Network configuration: NodeURL = %s, ChainID = %d", networkInfos.NodeURL, networkInfos.ChainID)

	// Smart contract and owner details
	contractAddress := "AS123fnc8H8MVMuiuaDiLkAeFGTobSjPvUEhJLtCjB8RQ5Dd1hkm" 
	//  reset without onlyOwner for debugging
	// contractAddress := "AS12niiD27mLinQfvQx5dKXm1YjXKkbeiFUVg4g9eHnpPrx4FDbRT" 

	function := "reset"                        // Function to call
	parameter := []byte{}                      // No parameters for reset function
	fee := uint64(1000000)                     // Operation fee
	maxGas := uint64(100000)                   // Maximum gas estimate
	coins := uint64(3100000000)                // Amount of coins for the operation
	expiryDelta := uint64(1000)                // Expiry time in seconds
	async := false                             // Wait for event
	
	var signer signer.Signer = &signer.WalletPlugin{} // Signer setup
	log.Printf("Signer: %+v\n", signer)

	operation := sendOperation.OperationBatch{NewBatch: false, CorrelationID: ""}

	// // Calling the reset function on the smart contract
	log.Println("Calling reset function on contract:", contractAddress)
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
		log.Fatalf("Error calling reset function: %v", err)
	}

	// Log operation response
	log.Printf("Operation Response: %+v", opResponse.OperationResponse)

	// Check if the reset function executed successfully
	if !async {
		// Wait for event if not async
		log.Println("Waiting for event from the contract...")
		events, err := node.ListenEvents(node.NewClient(networkInfos.NodeURL), nil, nil, nil, &opResponse.OperationResponse.OperationID, nil, true)
		if err != nil {
			log.Fatalf("Error listening for events: %v", err)
		}

		// Log the event
		if len(events) > 0 {
			log.Printf("Event received: %s", events[0].Data)
		} else {
			log.Println("No events received after operation")
		}
	} else {
		log.Println("Async mode: No events will be awaited.")
	}
}