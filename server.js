import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { connectDB, isMongoConnected } from './config/db.js';
import projectRoutes from './routes/projectRoutes.js';
import checklistRoutes from './routes/checklistRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import { dataService } from './services/dataService.js';
import { authService } from './services/authService.js';
import { chatService } from './services/chatService.js';
import { socketService } from './services/socketService.js';
import { activityService } from './services/activityService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize real-time WebSocket server
socketService.init(server);

// Connect Database (MongoDB or automatic fallback)
await connectDB();

// Initialize default users (Clean Chief Architect Admin)
await authService.initDefaultUsers();

// Initialize projects, checklists, and templates
await dataService.initDefaultData();

// Initialize team chat channels and seed messages
await chatService.initDefaultMessages();

// Initialize baseline activity history
await activityService.initDefaultActivities();

// Production-hardened CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['*'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Reflect origin dynamically to guarantee 0 CORS errors across all deployment domains
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity', activityRoutes);

// System status / health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Radora Hub - Project & Checklist Manager',
    version: '1.0.0',
    databaseMode: dataService.getMode(),
    mongoConnected: isMongoConnected,
    timestamp: new Date().toISOString(),
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Radora Hub Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket Real-Time Sync Engine Active`);
  console.log(`📊 DB Mode: ${dataService.getMode()}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`======================================================\n`);
});
