import express from 'express';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import { protect } from '../middleware/auth.js';
import {
  formatDate,
  getMonthRange,
  getWeekRange,
  getDatesInRange,
  calculateStreaks,
} from '../utils/dateHelpers.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { month, start, end } = req.query;
    const habits = await Habit.find({ userId: req.user._id });
    const habitCount = habits.length;

    let rangeStart;
    let rangeEnd;

    if (start && end) {
      rangeStart = start;
      rangeEnd = end;
    } else if (month) {
      const range = getMonthRange(month);
      rangeStart = range.start;
      rangeEnd = range.end;
    } else {
      const now = formatDate(new Date());
      const range = getMonthRange(now.slice(0, 7));
      rangeStart = range.start;
      rangeEnd = range.end;
    }

    const datesInRange = getDatesInRange(rangeStart, rangeEnd);
    const totalPossible = habitCount * datesInRange.length;

    const logs = await HabitLog.find({
      userId: req.user._id,
      date: { $gte: rangeStart, $lte: rangeEnd },
      completed: true,
    });

    const totalCompleted = logs.length;
    const completionRate =
      totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    const weekRange = getWeekRange(formatDate(new Date()));
    const weekLogs = await HabitLog.find({
      userId: req.user._id,
      date: { $gte: weekRange.start, $lte: weekRange.end },
      completed: true,
    });

    const monthRange = getMonthRange(formatDate(new Date()).slice(0, 7));
    const monthLogs = await HabitLog.find({
      userId: req.user._id,
      date: { $gte: monthRange.start, $lte: monthRange.end },
      completed: true,
    });

    const allCompletedLogs = await HabitLog.find({
      userId: req.user._id,
      completed: true,
    }).select('date');

    const dailyCompletionMap = {};
    allCompletedLogs.forEach((log) => {
      dailyCompletionMap[log.date] = (dailyCompletionMap[log.date] || 0) + 1;
    });

    const fullyCompletedDates = Object.entries(dailyCompletionMap)
      .filter(([, count]) => habitCount > 0 && count >= habitCount)
      .map(([date]) => date);

    const { currentStreak, longestStreak } = calculateStreaks(fullyCompletedDates);

    const chartData = datesInRange.map((date) => {
      const dayLogs = logs.filter((log) => log.date === date);
      return {
        date,
        completed: dayLogs.length,
        total: habitCount,
        rate: habitCount > 0 ? Math.round((dayLogs.length / habitCount) * 100) : 0,
      };
    });

    res.json({
      range: { start: rangeStart, end: rangeEnd },
      totalHabits: habitCount,
      totalCompleted,
      completionRate,
      weeklyCompleted: weekLogs.length,
      monthlyCompleted: monthLogs.length,
      currentStreak,
      longestStreak,
      chartData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
