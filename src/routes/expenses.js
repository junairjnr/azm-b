import express from 'express';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';
import { formatDate } from '../utils/dateHelpers.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { month, start, end } = req.query;
    const filter = { userId: req.user._id };

    if (month) {
      filter.date = { $regex: `^${month}` };
    } else if (start && end) {
      filter.date = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const byCategory = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    res.json({ expenses, total, byCategory, count: expenses.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount, category, description, date, paymentMethod } = req.body;
    if (!amount || amount <= 0 || !category?.trim()) {
      return res.status(400).json({ message: 'Amount and category are required' });
    }

    const expense = await Expense.create({
      userId: req.user._id,
      amount: Number(amount),
      category: category.trim(),
      description: description?.trim() || '',
      date: date || formatDate(new Date()),
      paymentMethod: paymentMethod || 'cash',
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const { amount, category, description, date, paymentMethod } = req.body;
    if (amount !== undefined) expense.amount = Number(amount);
    if (category !== undefined) expense.category = category.trim();
    if (description !== undefined) expense.description = description.trim();
    if (date !== undefined) expense.date = date;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
