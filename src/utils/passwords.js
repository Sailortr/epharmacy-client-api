import bcrypt from 'bcryptjs';

const rounds = process.env.NODE_ENV === 'test' ? 6 : 10;

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
