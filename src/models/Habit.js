import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Habit title is required'],
      trim: true,
    },
    color: {
      type: String,
      default: '#D4AF37',
    },
    icon: {
      type: String,
      default: '✨',
    },
    targetDurationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    reminderTime: {
      type: String,
      default: '',
    },
    reminderEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Habit', habitSchema);
