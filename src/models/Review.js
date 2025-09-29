import mongoose from 'mongoose';
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
  },
  { timestamps: true },
);

reviewSchema.index({ userId: 1, storeId: 1 }, { unique: true });
reviewSchema.index({ storeId: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
