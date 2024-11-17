package main

import (
	"fmt"
	"log"
	"strings"

	"os"

	"github.com/joho/godotenv"
	"github.com/massalabs/station/int/config"
	"github.com/massalabs/station/pkg/node"
	sendOperation "github.com/massalabs/station/pkg/node/sendoperation"
	"github.com/massalabs/station/pkg/node/sendoperation/callsc"
	"github.com/massalabs/station/pkg/node/sendoperation/signer"
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
	function := "reset"                        // Function to call
	parameter := []byte{}                      // No parameters for reset function
	fee := uint64(1)                        // Operation fee
	maxGas := uint64(100000)                   // Maximum gas estimate
	coins := uint64(3)                         // Amount of coins for the operation
	expiryDelta := uint64(1000)                // Expiry time in seconds
	async := false                             // Wait for event
	
	var signer signer.Signer = &signer.WalletPlugin{} // Signer setup

	// Create operation batch for the transaction
	operationBatch := sendOperation.OperationBatch{
		NewBatch:      true,             
		CorrelationID: "",               
	}

	// // Calling the reset function on the smart contract
	log.Println("Calling reset function on contract:", contractAddress)
	opResponse, err := CallFunction(
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
		operationBatch,
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

// imported from https://github.com/massalabs/station/blob/main/pkg/onchain/sc.go
// CallFunction calls a function of a smart contract on the blockchain. It returns the operation ID or an Error if any.
// If async is true, it returns directly the operation ID and does not wait for the event.
// Otherwise, it waits for the first event generated by the smart contract and returns it along with the operation ID.
func CallFunction(
	networkInfos *config.NetworkInfos,
	nickname string,
	addr string,
	function string,
	parameter []byte,
	fee uint64,
	maxGas uint64,
	coins uint64,
	expiryDelta uint64,
	async bool,
	operationBatch sendOperation.OperationBatch,
	signer signer.Signer,
	description string,
) (*OperationWithEventResponse, error) {
	client := node.NewClient(networkInfos.NodeURL)

	// Calibrate max_gas
	if maxGas == 0 {
		estimatedGasCost, err := sendOperation.EstimateGasCostCallSC(nickname, addr, function, parameter, coins, fee, client)
		if err != nil {
			return nil, fmt.Errorf("estimating Call SC gas cost for function '%s' at '%s': %w", function, addr, err)
		}

		maxGas = estimatedGasCost
	}

	// Create the operation
	callSC, err := callsc.New(addr, function, parameter,
		maxGas,
		coins)
	if err != nil {
		return nil, fmt.Errorf("creating callSC with '%s' at '%s': %w", function, addr, err)
	}

	operationResponse, err := sendOperation.Call(
		client,
		networkInfos.ChainID,
		expiryDelta,
		fee,
		callSC,
		nickname,
		operationBatch,
		signer,
		description,
	)
	if err != nil {
		return nil, fmt.Errorf("calling function '%s' at '%s' with '%+v': %w", function, addr, parameter, err)
	}

	return CallFunctionSuccess(async, operationResponse, client)
}

func CallFunctionSuccess(
	async bool,
	operationResponse *sendOperation.OperationResponse,
	client *node.Client,
) (*OperationWithEventResponse, error) {
	if async {
		return &OperationWithEventResponse{
			Event:             "Function called successfully but did not wait for event",
			OperationResponse: *operationResponse,
		}, nil
	}

	events, err := node.ListenEvents(client, nil, nil, nil, &operationResponse.OperationID, nil, true)
	if err != nil {
		if strings.Contains(err.Error(), "Timeout") {
			return &OperationWithEventResponse{
				Event:             "Operation submited successfully but no event generated. The operation may have been rejected",
				OperationResponse: *operationResponse,
			}, nil
		}

		return nil, fmt.Errorf("listening events for opId at %s : %w", operationResponse.OperationID, err)
	}

	return &OperationWithEventResponse{
		Event:             events[0].Data, // return first event; TO DO: return all events
		OperationResponse: *operationResponse,
	}, nil
}
