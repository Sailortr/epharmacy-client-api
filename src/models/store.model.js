import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

const StoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    rating: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    location: { type: locationSchema, required: true },
  },
  { timestamps: true, collection: 'stores' },
);

StoreSchema.index({ location: '2dsphere' });

const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);
export default Store;
