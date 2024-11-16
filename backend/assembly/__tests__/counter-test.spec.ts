import { Args, stringToBytes, u64ToBytes, boolToByte } from '@massalabs/as-types';
import { Storage, setDeployContext, generateEvent } from '@massalabs/massa-as-sdk';
import {increment,getCount,constructor,setCount,reset} from '../contracts/counter';
import {setOwner, ownerAddress, isOwner} from '../contracts/utils/ownership'

  const owner : string = 'AU1JC5Q7c6mV7TcEtj2yA1Cv49JSiFz4xS8dnbGbmKHbVfrmFHvJ';
  let ownerArg: StaticArray<u8> = new Args().add(owner).serialize();
  const randomUser : string = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiq';
  let randoUserArg: StaticArray<u8> = new Args().add(randomUser).serialize();
  const COUNT_KEY = stringToBytes('count');

  beforeAll(() => {
    log('beforeAll');
    setDeployContext();
    constructor(ownerArg);
  });

  describe('Counter unit tests', () => {

    describe('ownership', () => {

      test('ownerAddress', () =>
        expect(ownerAddress([])).toStrictEqual(stringToBytes(owner)));

      test('isOwner', () =>
        expect(isOwner(ownerArg)).toStrictEqual(boolToByte(true)));
      test('reset should fail if caller is not the owner', () => {
        setDeployContext(randomUser);
        expect(() => {reset();
        }).toThrow('Caller is not the owner');
      });
      test('reset should work if caller is the owner', () => {
        setDeployContext(owner);
        expect(() => {reset();
        }).not.toThrow();
      });
    })

    describe('count', () => {
      test('Initial count should be 7', () => {
        const count: StaticArray<u8> = Storage.get(COUNT_KEY);
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
     })
});