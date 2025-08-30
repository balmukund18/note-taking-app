import { Router } from 'express';
import authRoutes from './auth';
import notesRoutes from './notes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/notes', notesRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
