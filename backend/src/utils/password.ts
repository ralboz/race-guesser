import bcrypt from 'bcrypt';

const DEFAULT_SALT_ROUNDS = 10;

export async function hashPassword(plainText: string, saltRounds: number = DEFAULT_SALT_ROUNDS): Promise<string> {
  return bcrypt.hash(plainText, saltRounds);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
