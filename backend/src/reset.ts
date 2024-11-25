/* eslint-disable no-console */
import {
    Account,
    Mas,
    Web3Provider, 
    SmartContract,
    Args
} from '@massalabs/massa-web3';
import * as dotenv from 'dotenv';

dotenv.config();

// Create an account using credentials from the environment variables.
// Build a provider for interacting with the Massa blockchain
const account = await Account.fromEnv();
const provider = Web3Provider.buildnet(account);

const contractAddress = "AS12b4pgVgvF9GKL6S8wZ6AEKENeqihZ8Qmxkr5NT4Ho7wYp9D9NT";

// Create a SmartContract instance to interact with the specified contract
const contract = new SmartContract(provider, contractAddress);

const owner = 'AU1JC5Q7c6mV7TcEtj2yA1Cv49JSiFz4xS8dnbGbmKHbVfrmFHvJ';

// Serialize the owner address into arguments for the smart contract function
let ownerArg = new Args().addString(owner).serialize();

console.log('🚀 Initiating counter reset operation...');

// Define options for the smart contract call
const CallSCOptions = {
    ownerArg, // Pass the serialized owner argument
    coins: Mas.fromString('0.01') // Specify the amount of coins for the operation
};

// Call the `reset` function in the smart contract with the defined options
const operation = await contract.call(
    'reset',
    undefined, // No additional arguments are passed to the reset function
    CallSCOptions
);

// Wait for the operation to be finalized on the blockchain
await operation.waitFinalExecution();

console.log('✅ Counter reset successfully! The operation is now finalized.');