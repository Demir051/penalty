import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import logRoutes from './routes/logs.js';
import notificationRoutes from './routes/notifications.js';
import penaltyRoutes from './routes/penalties.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware - CORS
// Allow all Netlify domains and localhost for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow all Netlify domains
    if (origin.includes('.netlify.app')) {
      return callback(null, true);
    }
    
    // Allow specific frontend URL if set
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    // For production, you might want to restrict this
    // For now, allow all origins to avoid CORS issues
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (basic) - Skip for health check and more lenient for development
const rateLimitMap = new Map();
const rateLimit = (req, res, next) => {
  // Skip rate limiting for health check
  if (req.path === '/api/health') {
    return next();
  }
  
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 1 * 60 * 1000; // 1 minute (reduced from 15)
  const maxRequests = process.env.NODE_ENV === 'production' ? 200 : 1000; // More lenient in development

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const record = rateLimitMap.get(ip);
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return next();
  }

  if (record.count >= maxRequests) {
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Rate limit exceeded for IP: ${ip}, count: ${record.count}`);
    }
    return res.status(429).json({ 
      message: `Too many requests. Please try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.` 
    });
  }

  record.count++;
  next();
};

app.use(rateLimit);

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/penalties', penaltyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
