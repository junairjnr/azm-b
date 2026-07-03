import express from 'express';
import DiaryEntry from '../models/DiaryEntry.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { date, month } = req.query;
    const filter = { userId: req.user._id };

    if (date) filter.date = date;
    if (month) filter.date = { $regex: `^${month}` };

    const entries = await DiaryEntry.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { date, title, content, mood } = req.body;
    if (!date || !content?.trim()) {
      return res.status(400).json({ message: 'Date and content are required' });
    }

    const entry = await DiaryEntry.create({
      userId: req.user._id,
      date,
      title: title?.trim() || '',
      content: content.trim(),
      mood: mood || 'good',
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const entry = await DiaryEntry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const { title, content, mood, date } = req.body;
    if (title !== undefined) entry.title = title.trim();
    if (content !== undefined) entry.content = content.trim();
    if (mood !== undefined) entry.mood = mood;
    if (date !== undefined) entry.date = date;
    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entry = await DiaryEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
