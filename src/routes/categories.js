import express from 'express';
import Category from '../models/Category.js';
import Habit from '../models/Habit.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user._id }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const category = await Category.create({
      userId: req.user._id,
      name: name.trim(),
      color: color || '#D4AF37',
      icon: icon || '📁',
    });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name !== undefined) category.name = name.trim();
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;
    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await Habit.updateMany(
      { userId: req.user._id, categoryId: category._id },
      { $set: { categoryId: null } }
    );
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
