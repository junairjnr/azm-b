import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    color: {
      type: String,
      default: '#D4AF37',
    },
    icon: {
      type: String,
      default: '📁',
    },
  },
  { timestamps: true }
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
