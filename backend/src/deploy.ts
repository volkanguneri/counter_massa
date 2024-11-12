/* eslint-disable no-console */
import {
  Account,
  Mas,
  SmartContract,
  Web3Provider,
} from '@massalabs/massa-web3';
import { getScByteCode } from './utils';

const account = await Account.fromEnv();
const provider = Web3Provider.buildnet(account);

console.log('Deploying contract...');

const byteCode = getScByteCode('build', 'counter.wasm');
const contract = await SmartContract.deploy(
  provider,
  byteCode,
  undefined, //The constructor doesn't require any parameter
  { coins: Mas.fromString('0.01') },
);

console.log('Contract deployed at:', contract.address);
