import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    rating: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true },
);

storeSchema.index({ location: '2dsphere' });

export default mongoose.model('Store', storeSchema);
