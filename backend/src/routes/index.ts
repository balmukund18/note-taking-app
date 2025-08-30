import { Router } from 'express';
import authRoutes from './auth';
import notesRoutes from './notes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/notes', notesRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      origin: req.headers.origin || 'no-origin',
      userAgent: req.headers['user-agent'] || 'no-user-agent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST health check for testing
router.post('/health', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'POST health check successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      body: req.body,
      origin: req.headers.origin || 'no-origin'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'POST health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
