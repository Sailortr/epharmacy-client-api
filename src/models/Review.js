import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

const ReviewSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Types.ObjectId, ref: 'Product', required: true, index: true },
    storeId: { type: Types.ObjectId, ref: 'Store' }, // opsiyonel
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true },
);

ReviewSchema.index(
  { userId: 1, productId: 1 },
  {
    unique: true,
    name: 'uniq_user_product',
    partialFilterExpression: {
      userId: { $type: 'objectId' },
      productId: { $type: 'objectId' },
    },
  },
);

export default mongoose.model('Review', ReviewSchema);
