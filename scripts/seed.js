require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Habit = require('../src/models/Habit');
const HabitLog = require('../src/models/HabitLog');
const { formatDate } = require('../src/utils/dateHelpers');

const seed = async () => {
  try {
    await connectDB();

    await HabitLog.deleteMany({});
    await Habit.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({ email: 'demo@habittracker.com' });

    const user = await User.create({
      name: 'Demo User',
      email: 'demo@habittracker.com',
      password: 'demo123',
    });

    const categories = await Category.insertMany([
      { userId: user._id, name: 'Personal', color: '#D4AF37', icon: '🏠' },
      { userId: user._id, name: 'Occupational', color: '#6366f1', icon: '💼' },
      { userId: user._id, name: 'Health', color: '#22c55e', icon: '❤️' },
    ]);

    const habitsData = [
      { title: 'Walking', color: '#22c55e', icon: '🚶', categoryId: categories[2]._id, targetDurationMinutes: 30, reminderTime: '07:00', reminderEnabled: true },
      { title: 'Studying', color: '#3b82f6', icon: '📚', categoryId: categories[1]._id, targetDurationMinutes: 60, reminderTime: '09:00', reminderEnabled: true },
      { title: 'Reading', color: '#a855f7', icon: '📖', categoryId: categories[0]._id, targetDurationMinutes: 10, reminderTime: '20:00', reminderEnabled: true },
      { title: 'Gym', color: '#ef4444', icon: '💪', categoryId: categories[2]._id, targetDurationMinutes: 45 },
      { title: 'Prayer', color: '#f59e0b', icon: '🙏', categoryId: categories[0]._id, targetDurationMinutes: 15, reminderTime: '06:00', reminderEnabled: true },
      { title: 'Coding', color: '#6366f1', icon: '💻', categoryId: categories[1]._id, targetDurationMinutes: 120 },
    ];

    const habits = await Habit.insertMany(
      habitsData.map((h) => ({ ...h, userId: user._id }))
    );

    const logs = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);

      for (const habit of habits) {
        if (Math.random() > 0.3) {
          logs.push({
            userId: user._id,
            habitId: habit._id,
            date: dateStr,
            completed: true,
            durationSeconds: (habit.targetDurationMinutes || 10) * 60,
          });
        }
      }
    }

    await HabitLog.insertMany(logs);

    console.log('Seed data created successfully!');
    console.log('Demo login: demo@habittracker.com / demo123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
