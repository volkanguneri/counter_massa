import { Storage, Context, generateEvent } from '@massalabs/massa-as-sdk';
import { Args, u64ToBytes, stringToBytes } from '@massalabs/as-types';

export function constructor(): void {
  assert(Context.isDeployingContract(), "Constructor can only be called during deployment");
  initialize();
}

export const countKey = stringToBytes('count');

// Initializes the counter to 0
export function initialize(): void {
  Storage.set(countKey, u64ToBytes(0));
  generateEvent("The counter initialized to 0");
}

// Gets the count value
export function getCount(): StaticArray<u8> {
  const countBytes = Storage.get(countKey);
  return countBytes;
}

export function increment(n: StaticArray<u8>): StaticArray<u8> {
  // Deserialize the argument as an u64 number
  const incrementValue: u64 = new Args(n).nextU64().expect('n argument is missing or invalid');
  const count : StaticArray<u8> = Storage.get(countKey);  
  const countu64 : u64 = new Args(count).nextU64().expect('count argument is missing or invalid')
  const totalCount: u64 = countu64 + incrementValue;
  const newCountBytes :  StaticArray<u8> = u64ToBytes(totalCount);
  Storage.set(countKey, newCountBytes);
  generateEvent(`Counter incremented by ${incrementValue}. New value: ${totalCount}`);
  return newCountBytes;
}


