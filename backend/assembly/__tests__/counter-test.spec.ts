import { Args, stringToBytes, u64ToBytes, bytesToU64 } from '@massalabs/as-types';
import { Storage, setDeployContext, generateEvent } from '@massalabs/massa-as-sdk';
import {
  increment,
  getCount,
  constructor,
  setCount,
  reset
} from '../contracts/counter';

describe('Counter unit tests', () => {
  beforeAll(() => {
    setDeployContext();
    // init contract
    constructor();
  });

  test('Initial count should be 7', () => {
    const countKey = stringToBytes('count');
    const count: StaticArray<u8> = Storage.get(countKey);
    expect(count).toStrictEqual(u64ToBytes(7));
  });

  test('getCount function should get the count', () => {
    expect(getCount()).toStrictEqual(u64ToBytes(7));
  });

  test('setCount function should set the count', () => {
    setCount(u64ToBytes(11));
    expect(getCount()).toStrictEqual(u64ToBytes(11));
  });

  test('increment should increment the count', () => {
    setCount(u64ToBytes(3));
    increment(u64ToBytes(4));
    expect(getCount()).toStrictEqual(u64ToBytes(7));
  });

  test('reset should reset the count to 0', () => {
    reset();
    expect(getCount()).toStrictEqual(u64ToBytes(0));
  });
});