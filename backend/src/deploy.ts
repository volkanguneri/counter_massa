/* eslint-disable no-console */
import {
  Account,
  Mas,
  SmartContract,
  Web3Provider, Args
} from '@massalabs/massa-web3';
import { getScByteCode } from './utils';

const account = await Account.fromEnv();
const provider = Web3Provider.buildnet(account);

const owner = 'AU1JC5Q7c6mV7TcEtj2yA1Cv49JSiFz4xS8dnbGbmKHbVfrmFHvJ';
let ownerArg = new Args().addString(owner).serialize();

console.log('Deploying contract...');

const byteCode = getScByteCode('build', 'counter.wasm');
const contract = await SmartContract.deploy(
  provider,
  byteCode,
  ownerArg,
  { coins: Mas.fromString('0.01') },
);

console.log('Contract deployed at:', contract.address);

const events = await provider.getEvents({
  smartContractAddress: contract.address,
});

for (const event of events) {
  console.log('Event: ', event.data);
}
