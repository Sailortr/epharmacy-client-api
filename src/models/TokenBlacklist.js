import mongoose from 'mongoose';

const tokenBL = new mongoose.Schema({
  tokenHash: { type: String, index: true, unique: true },
  expireAt: { type: Date, index: { expires: 0 } }, // TTL
  reason: String,
});
export default mongoose.model('TokenBlacklist', tokenBL);
