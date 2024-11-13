import { Args, stringToBytes, u64ToBytes, bytesToU64 } from '@massalabs/as-types';
import { Storage, setDeployContext, generateEvent } from '@massalabs/massa-as-sdk';
import {
  increment,
  initialize,
  getCount,
  constructor
} from '../contracts/counter';

describe('Counter unit tests', () => {
  beforeAll(() => {
    setDeployContext();
    // init contract
    constructor();
  });

  // // Global variables
  // const countKey = stringToBytes('count');
  // const count : StaticArray<u8> = Storage.get(countKey);

  test('Initial count should be 0', () => {
    const countKey = stringToBytes('count');
    const count : StaticArray<u8> = Storage.get(countKey);
    expect(count).toStrictEqual(u64ToBytes(0));
  });

  test('Initialize function should initialize the counter', () => {
    const countKey = stringToBytes('count');
    Storage.set(countKey, u64ToBytes(10));
    initialize();
    const count : StaticArray<u8> = Storage.get(countKey);
    expect(count).toStrictEqual(u64ToBytes(0));
  });

  test('getCount function should get the count', () => {
    initialize();
    const countKey = stringToBytes('count');
    Storage.set(countKey, u64ToBytes(11));
    const count: StaticArray<u8> = Storage.get(countKey);
    const getCountResult = getCount();
    expect(count).toStrictEqual(getCountResult);
  });

  test('increment should increment the count', () => {
    initialize();
    const incrementValueU64: u64 = 111;
    const incrementValueBytes: StaticArray<u8> = u64ToBytes(incrementValueU64);
    const finalCountBytes: StaticArray<u8> = increment(incrementValueBytes);
    const finalCountU64 = bytesToU64(finalCountBytes);
    expect(finalCountU64).toStrictEqual(incrementValueU64);
  });
});