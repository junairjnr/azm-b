import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank', 'other'],
      default: 'cash',
    },
  },
  { timestamps: true }
);

expenseSchema.index({ userId: 1, date: -1 });

  export default mongoose.model('Expense', expenseSchema);
