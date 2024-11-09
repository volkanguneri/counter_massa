import { Args } from '@massalabs/as-types';
import { Storage, setDeployContext, generateEvent } from '@massalabs/massa-as-sdk';
import { 
    // increment, 
    initialize, getCount, constructor } from '../contracts/counter';

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
    Storage.set("count", "15");
    const countStr: string = getCount(); 
    expect(countStr).toBe("15");
  });


//   Helper function to serialize a number to StaticArray<u8> for testing
function serializeU32(n: u32): StaticArray<u8> {
    const args = new Args();
    args.add(n);
    return args.serialize();
}

//   test('increment', () => {
//     const count = Storage.get("count");
//     increment(serializeU32(5));
//     const newCount = Storage.get("count");
//     expect(newCount).toBe(count + 5);
//   });

});