/* eslint-disable no-console */
import {
    Account,
    Mas,
    Web3Provider, 
    SmartContract,
    Args
  } from '@massalabs/massa-web3';
  
const account = await Account.fromEnv("PRIVATE_KEY");
const provider = Web3Provider.buildnet(account);

const contractAddress : string = "AS12b4pgVgvF9GKL6S8wZ6AEKENeqihZ8Qmxkr5NT4Ho7wYp9D9NT";
const contract = new SmartContract(provider, contractAddress);

const owner = 'AU1JC5Q7c6mV7TcEtj2yA1Cv49JSiFz4xS8dnbGbmKHbVfrmFHvJ';
let ownerArg = new Args().addString(owner).serialize();


const CallSCOptions = {
    ownerArg,
    coins: Mas.fromString('0.01')
}

const operation = await contract.call(
    'reset',
    undefined,
    CallSCOptions
);

await operation.waitFinalExecution()

console.log('Transfer operation is final');