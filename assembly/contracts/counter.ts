import { Storage, Context, generateEvent} from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';

export function constructor(): void {
    assert(Context.isDeployingContract(), "Constructor can only be called during deployment");
    initialize();
}

// Initializes the counter to 0
export function initialize(): void {
  Storage.set("count", "0");
  generateEvent("The counter initialized to 0");
}


// Gets the count value : (issue: need to be converted to integer to be retruned)
export function getCount(): string {
  const countStr : string = Storage.get("count");
  if (countStr == null) return "0";
  return countStr;
}

// export function increment(n: StaticArray<number>): u32 {
//   // Serialize the argument as an u32 number
//   const incrementValue = new Args(n).nextU32().expect('Number argument is missing or invalid');
//   // Return a greeting message using the number
//   let count = getCount();
//   const newCount = count += incrementValue;
//   Storage.set("count", newCount.toString());
//   generateEvent(`Counter incremented by ${incrementValue}. New value: ${newCount}`);
//   return newCount;
// }
