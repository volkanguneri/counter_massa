import { Args, stringToBytes, u32ToBytes, bytesToU32} from '@massalabs/as-types';
import { Storage, setDeployContext, generateEvent } from '@massalabs/massa-as-sdk';
import { 
    increment, 
    initialize, 
    getCount,
     constructor } from '../contracts/counter';

describe('Counter unit tests', () => {
  beforeAll(() => {
    setDeployContext();
       // init contract
    constructor();
  });
  
  test('Initial count should be 0', () => {
    const countStr : string = Storage.get("count");
    expect(countStr).toBe("0");
  });

  test('Initialize function should initialize the counter', () => {
    Storage.set("count", "10");
    initialize();
    const countStr : string = Storage.get("count")
    expect(countStr).toBe("0");
  });

  test('getCount function should gets the count', () => {
    Storage.set("count", "10");    
    const countStr = Storage.get("count"); 
    const countBytes : StaticArray<u8> = stringToBytes(countStr);
    const getCountResult = getCount();
    expect(countBytes).toStrictEqual(getCountResult);
  });

  test('increment', () => {
    const incrementValueU32 : u32 = 65;
    const incrementValueBytes : StaticArray<u8> = u32ToBytes(incrementValueU32);
    const finalCountBytes : StaticArray<u8> = increment(incrementValueBytes); 
    let finalCountU32 : u32 = new Args(finalCountBytes).nextU32().expect('finalCountBytes argument is missing or invalid');
    expect(finalCountU32).toStrictEqual(incrementValueU32);
  });
});