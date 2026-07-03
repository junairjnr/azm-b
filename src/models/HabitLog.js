import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    timerStartedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

habitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

export default mongoose.model('HabitLog', habitLogSchema);
