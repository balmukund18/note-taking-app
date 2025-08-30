import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth';
import notesRoutes from './notes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/notes', notesRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      status: dbStates[dbStatus as keyof typeof dbStates],
      connected: dbStatus === 1
    }
  });
});

export default router;
