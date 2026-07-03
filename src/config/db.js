import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error(
      '\nMongoDB is not running. Start it with one of these options:\n' +
        '  1. Docker:  docker compose up -d\n' +
        '  2. Homebrew: brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community\n' +
        '  3. Atlas:    set MONGODB_URI in backend/.env to your MongoDB Atlas connection string\n'
    );
    process.exit(1);
  }
};

export default connectDB;
