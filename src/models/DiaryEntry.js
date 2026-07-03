import mongoose from 'mongoose';

const diaryEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Diary content is required'],
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'bad', 'awful'],
      default: 'good',
    },
  },
  { timestamps: true }
);

diaryEntrySchema.index({ userId: 1, date: 1 });

export default mongoose.model('DiaryEntry', diaryEntrySchema);
