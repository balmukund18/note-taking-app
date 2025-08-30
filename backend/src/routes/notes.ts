import { Router } from 'express';
import {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
  togglePin,
  toggleArchive,
  searchNotes,
} from '../controllers/notesController';
import {
  validateCreateNote,
  validateUpdateNote,
} from '../middleware/validation';
import { authenticateToken, requireEmailVerification } from '../middleware/auth';

const router = Router();

// All routes require authentication and email verification
router.use(authenticateToken);
router.use(requireEmailVerification);

// Notes CRUD operations
router.post('/', validateCreateNote, createNote);
router.get('/', getNotes);
router.get('/search', searchNotes);
router.get('/:id', getNote);
router.put('/:id', validateUpdateNote, updateNote);
router.delete('/:id', deleteNote);

// Note actions
router.post('/:id/pin', togglePin);
router.post('/:id/archive', toggleArchive);

export default router;
