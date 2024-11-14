import { Storage, Context, generateEvent } from '@massalabs/massa-as-sdk';
import { Args, u64ToBytes, stringToBytes } from '@massalabs/as-types';

export function constructor(): void {
  assert(Context.isDeployingContract(), "Constructor can only be called during deployment");
  initialize();
}

export const COUNT_KEY = stringToBytes('count');

// Initializes the counter to 7
export function initialize(): void {
  setCount(u64ToBytes(7));
}

// Gets the count value
export function getCount(): StaticArray<u8> {
  return Storage.get(COUNT_KEY);
}

export function setCount(c: StaticArray<u8>): void {
  const countValue = new Args(c)
    .nextU64()
    .expect('count argument is missing or invalid');
  Storage.set(COUNT_KEY, u64ToBytes(countValue));
  generateEvent(`Counter set to ${countValue}`);
}

export function increment(n: StaticArray<u8>): void {
  const incrementValue = new Args(n)
    .nextU64()
    .expect('increment argument is missing or invalid');
  const countValue = new Args(getCount()).nextU64().expect('getCount is missing or invalid');
  const totalCount = countValue + incrementValue;
  setCount(u64ToBytes(totalCount));
}

export function reset(): void {
  setCount(u64ToBytes(0));
}
