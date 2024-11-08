import { Storage, Context, generateEvent} from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';

// check all types

let count: u32 = 0;

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
export function getCount(): u32 {
  const countStr = Storage.get("count");
  if (countStr == null) return 0;
  return parseInt(countStr);
}


// Increments the counter
// - Create a function that increments the counter by a specified number `n` passed as an argument using `Args` object.
// - Emit an event when counter is incremented
// - This function is meant to be called from frontend

export function increment(n:u16): void {
  let count = getCount();
  count += n;
  Storage.set("count", count.toString());
  generateEvent("The counter is incremented to" + count.toString());
}


// Fonction pour décrémenter le compteur (si supérieur à zéro)
export function decrement(): void {
  let count = getCount();
  assert(count > 0, "Le compteur ne peut pas être négatif");
  count -= 1;
  Storage.set("count", count.toString());
  generateEvent("Le compteur a été décrémenté à: " + count.toString());
}
