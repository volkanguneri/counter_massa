import { Storage, Context, generateEvent } from '@massalabs/massa-as-sdk';
import { Args, u32ToBytes, stringToBytes } from '@massalabs/as-types';

export function constructor(): void {
  assert(Context.isDeployingContract(), "Constructor can only be called during deployment");
  initialize();
}

// Initializes the counter to 0
export function initialize(): void {
  Storage.set("count", "0");
  generateEvent("The counter initialized to 0");
}

// Gets the count value
export function getCount(): StaticArray<u8> {
  const countStr: string = Storage.get("count");
  const countBytes: StaticArray<u8> = stringToBytes(countStr);
  return countBytes;
}

export function increment(n: StaticArray<u8>): StaticArray<u8> {
  // Deserialize the argument as an u32 number
  const incrementValue: u32 = new Args(n).nextU32().expect('n argument is missing or invalid');

  const countStr: string = Storage.get("count");

  let countU32: u32 = u32(i32.parse(countStr));
  const newCount: u32 = countU32 + incrementValue;

  Storage.set("count", newCount.toString());
  generateEvent(`Counter incremented by ${incrementValue}. New value: ${newCount}`);

  const newCountBytes: StaticArray<u8> = u32ToBytes(newCount);
  return newCountBytes;
}