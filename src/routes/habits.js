import express from 'express';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import { protect } from '../middleware/auth.js';
import { formatDate } from '../utils/dateHelpers.js';

const router = express.Router();

router.use(protect);

const enrichHabitsWithLogs = async (habits, userId, date) => {
  const logs = await HabitLog.find({ userId, date });
  const logMap = {};
  logs.forEach((log) => {
    logMap[log.habitId.toString()] = log;
  });

  return habits.map((habit) => {
    const log = logMap[habit._id.toString()];
    const obj = habit.toObject ? habit.toObject() : habit;
    return {
      ...obj,
      completed: log?.completed || false,
      durationSeconds: log?.durationSeconds || 0,
      timerStartedAt: log?.timerStartedAt || null,
      isTimerRunning: !!log?.timerStartedAt,
    };
  });
};

router.get('/', async (req, res) => {
  try {
    const { date, categoryId } = req.query;
    const filter = { userId: req.user._id };
    if (categoryId) filter.categoryId = categoryId;

    const habits = await Habit.find(filter)
      .populate('categoryId', 'name color icon')
      .sort({ createdAt: -1 });

    if (!date) return res.json(habits);

    const enriched = await enrichHabitsWithLogs(habits, req.user._id, date);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title,
      color,
      icon,
      categoryId,
      targetDurationMinutes,
      reminderTime,
      reminderEnabled,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Habit title is required' });
    }

    const habit = await Habit.create({
      userId: req.user._id,
      title: title.trim(),
      color: color || '#D4AF37',
      icon: icon || '✨',
      categoryId: categoryId || null,
      targetDurationMinutes: targetDurationMinutes || 0,
      reminderTime: reminderTime || '',
      reminderEnabled: reminderEnabled || false,
    });

    const populated = await Habit.findById(habit._id).populate('categoryId', 'name color icon');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    const fields = [
      'title',
      'color',
      'icon',
      'categoryId',
      'targetDurationMinutes',
      'reminderTime',
      'reminderEnabled',
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        habit[field] = field === 'title' ? req.body[field].trim() : req.body[field];
      }
    });

    await habit.save();
    const populated = await Habit.findById(habit._id).populate('categoryId', 'name color icon');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    await HabitLog.deleteMany({ habitId: habit._id, userId: req.user._id });
    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/toggle', async (req, res) => {
  try {
    const { date, durationSeconds } = req.body;
    const targetDate = date || formatDate(new Date());

    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    let log = await HabitLog.findOne({
      userId: req.user._id,
      habitId: habit._id,
      date: targetDate,
    });

    if (log) {
      log.completed = !log.completed;
      if (durationSeconds !== undefined) {
        log.durationSeconds = durationSeconds;
      }
      log.timerStartedAt = null;
      await log.save();
    } else {
      log = await HabitLog.create({
        userId: req.user._id,
        habitId: habit._id,
        date: targetDate,
        completed: true,
        durationSeconds: durationSeconds || 0,
      });
    }

    res.json({
      habitId: habit._id,
      date: targetDate,
      completed: log.completed,
      durationSeconds: log.durationSeconds,
      timerStartedAt: log.timerStartedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/timer/start', async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date || formatDate(new Date());

    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    let log = await HabitLog.findOne({
      userId: req.user._id,
      habitId: habit._id,
      date: targetDate,
    });

    if (!log) {
      log = await HabitLog.create({
        userId: req.user._id,
        habitId: habit._id,
        date: targetDate,
        completed: false,
        durationSeconds: 0,
        timerStartedAt: new Date(),
      });
    } else {
      log.timerStartedAt = new Date();
      await log.save();
    }

    res.json({
      habitId: habit._id,
      date: targetDate,
      timerStartedAt: log.timerStartedAt,
      durationSeconds: log.durationSeconds,
      completed: log.completed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/timer/stop', async (req, res) => {
  try {
    const { date, durationSeconds } = req.body;
    const targetDate = date || formatDate(new Date());

    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    let log = await HabitLog.findOne({
      userId: req.user._id,
      habitId: habit._id,
      date: targetDate,
    });

    if (!log) {
      log = await HabitLog.create({
        userId: req.user._id,
        habitId: habit._id,
        date: targetDate,
        completed: false,
        durationSeconds: durationSeconds || 0,
      });
    } else {
      const elapsed = log.timerStartedAt
        ? Math.floor((Date.now() - new Date(log.timerStartedAt).getTime()) / 1000)
        : 0;
      log.durationSeconds = (log.durationSeconds || 0) + elapsed + (durationSeconds || 0);
      log.timerStartedAt = null;

      if (habit.targetDurationMinutes > 0) {
        const targetSeconds = habit.targetDurationMinutes * 60;
        log.completed = log.durationSeconds >= targetSeconds;
      } else {
        log.completed = true;
      }
      await log.save();
    }

    res.json({
      habitId: habit._id,
      date: targetDate,
      completed: log.completed,
      durationSeconds: log.durationSeconds,
      timerStartedAt: null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/logs/range', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const habits = await Habit.find({ userId: req.user._id })
      .populate('categoryId', 'name color icon')
      .sort({ createdAt: 1 });

    const logs = await HabitLog.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
    });

    const logMap = {};
    logs.forEach((log) => {
      const key = `${log.date}-${log.habitId}`;
      logMap[key] = log;
    });

    const startDate = new Date(start + 'T12:00:00');
    const endDate = new Date(end + 'T12:00:00');
    const rows = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = formatDate(current);
      rows.push({
        date: dateStr,
        habits: habits.map((habit) => {
          const log = logMap[`${dateStr}-${habit._id}`];
          return {
            habitId: habit._id,
            title: habit.title,
            color: habit.color,
            icon: habit.icon,
            completed: log?.completed || false,
            durationSeconds: log?.durationSeconds || 0,
          };
        }),
      });
      current.setDate(current.getDate() + 1);
    }

    res.json({ habits, rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
