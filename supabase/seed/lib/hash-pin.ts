// bcryptjs is the pure-JS port of bcrypt — same algorithm, identical hash
// output, no native compilation required (important on Windows without node-gyp).
// The auth layer (Task 1.6) should use the same library for verifyPin.
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
