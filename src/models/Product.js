import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: 'text' },
    slug: { type: String, unique: true, index: true },
    brand: String,
    form: String,
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0 },
    tags: [String],
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    rxRequired: { type: Boolean, default: false },
    description: String,

    ratingCount: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.index({ brand: 1, price: 1, tags: 1 });

productSchema.index({ ratingAverage: -1, ratingCount: -1 });

export default mongoose.model('Product', productSchema);
