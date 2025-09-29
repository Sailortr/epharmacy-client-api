import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, min: 0, required: true },
    priceAtAdd: { type: Number, min: 0, required: true },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    items: [itemSchema],
  },
  { timestamps: true },
);

export default mongoose.model('Cart', cartSchema);
