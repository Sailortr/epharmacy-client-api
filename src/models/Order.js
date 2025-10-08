import mongoose from 'mongoose';

const { Schema } = mongoose;

const ItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String },
    qty: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    store: { type: Schema.Types.ObjectId, ref: 'Store', default: null },

    items: {
      type: [ItemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'items required'],
      required: true,
    },

    shipping: { type: Object, default: {} },

    paymentMethod: {
      type: String,
      enum: ['card', 'cash', 'transfer'],
      default: 'card',
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'shipped', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    total: { type: Number, default: 0, min: 0 },

    paymentRef: { type: String, default: null },
  },
  { timestamps: true },
);

OrderSchema.virtual('userId').get(function () {
  return this.user;
});
OrderSchema.virtual('orderTotal').get(function () {
  return this.total;
});

function computeTotal(items = []) {
  return items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0), 0);
}

OrderSchema.pre('save', function (next) {
  this.total = computeTotal(this.items);
  next();
});

OrderSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  const items = update.items || update.$set?.items;
  if (items) {
    const newTotal = computeTotal(items);
    if (update.$set) update.$set.total = newTotal;
    else update.total = newTotal;
  }
  next();
});

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ store: 1, createdAt: -1 });

OrderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
