import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        title: String,
        qty: Number,
        price: Number,
      },
    ],
    orderTotal: Number,
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
    paymentRef: String,
  },
  { timestamps: true },
);

export default mongoose.model('Order', orderSchema);
