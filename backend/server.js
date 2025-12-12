import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import logRoutes from './routes/logs.js';

import User from './models/User.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/penalty', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/__seed_admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ username: 'admin' });

    if (existingAdmin) {
      existingAdmin.password = '123';
      await existingAdmin.save();

      return res.json({
        message: 'Admin already exists, password updated',
        username: 'admin',
        password: '123',
      });
    }

    const admin = new User({
      username: 'admin',
      email: 'admin@marti.com',
      password: '123',
      fullName: 'Admin User',
      role: 'admin',
    });

    await admin.save();

    res.json({
      message: 'Admin user created',
      username: 'admin',
      password: '123',
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Admin seed failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



