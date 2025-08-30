import { Request, Response } from 'express';
import { Note, INote } from '../models/Note';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  ValidationError,
  AuthenticationError,
  catchAsync,
} from '../middleware/errorHandler';

export interface NotesResponse {
  success: boolean;
  message: string;
  data?: {
    note?: Partial<INote>;
    notes?: Partial<INote>[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

/**
 * POST /api/notes
 * Create a new note
 */
export const createNote = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
  }

  const { title, content, tags, isPinned } = req.body;

  const note = new Note({
    title: title.trim(),
    content: content.trim(),
    userId: req.user._id,
    tags: tags || [],
    isPinned: isPinned || false,
    isArchived: false,
  });

  await note.save();

  logger.info(`Note created by user ${req.user._id}: ${note._id}`);

  res.status(201).json({
    success: true,
    message: 'Note created successfully',
    data: {
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    },
  });
});

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 */
export const getNotes = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const tags = req.query.tags as string;
  const isPinned = req.query.isPinned as string;
  const isArchived = req.query.isArchived as string;

  // Build query
  const query: any = { userId: req.user._id };

  // Add filters
  if (search) {
    query.$text = { $search: search };
  }

  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    query.tags = { $in: tagArray };
  }

  if (isPinned !== undefined) {
    query.isPinned = isPinned === 'true';
  }

  if (isArchived !== undefined) {
    query.isArchived = isArchived === 'true';
  }

  // Calculate skip
  const skip = (page - 1) * limit;

  // Build sort criteria
  const sort: any = {};
  if (query.isPinned === true) {
    sort.isPinned = -1;
  }
  sort.createdAt = -1;

  // Execute query
  const [notes, total] = await Promise.all([
    Note.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Note.countDocuments(query),
  ]);

  const pages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    message: 'Notes retrieved successfully',
    data: {
      notes: notes.map(note => ({
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    },
  });
});

/**
 * GET /api/notes/:id
 * Get a specific note
 */
export const getNote = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
  }

  const { id } = req.params;

  const note = await Note.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!note) {
    throw new NotFoundError('Note not found', 'NOTE_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    message: 'Note retrieved successfully',
    data: {
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    },
  });
});

/**
 * PUT /api/notes/:id
 * Update a specific note
 */
export const updateNote = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
  }

  const { id } = req.params;
  const { title, content, tags, isPinned, isArchived } = req.body;

  const note = await Note.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!note) {
    throw new NotFoundError('Note not found', 'NOTE_NOT_FOUND');
  }

  // Update fields if provided
  if (title !== undefined) {
    note.title = title.trim();
  }
  if (content !== undefined) {
    note.content = content.trim();
  }
  if (tags !== undefined) {
    note.tags = tags;
  }
  if (isPinned !== undefined) {
    note.isPinned = isPinned;
  }
  if (isArchived !== undefined) {
    note.isArchived = isArchived;
  }

  await note.save();

  logger.info(`Note updated by user ${req.user._id}: ${note._id}`);

  res.status(200).json({
    success: true,
    message: 'Note updated successfully',
    data: {
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    },
  });
});

/**
 * DELETE /api/notes/:id
 * Delete a specific note
 */
export const deleteNote = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
  }

  const { id } = req.params;

  const note = await Note.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!note) {
    throw new NotFoundError('Note not found', 'NOTE_NOT_FOUND');
  }

  await Note.findByIdAndDelete(id);

  logger.info(`Note deleted by user ${req.user._id}: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Note deleted successfully',
  });
});

/**
 * POST /api/notes/:id/pin
 * Toggle pin status of a note
 */
export const togglePin = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
  }

  const { id } = req.params;

  const note = await Note.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!note) {
    throw new NotFoundError('Note not found', 'NOTE_NOT_FOUND');
  }

  note.isPinned = !note.isPinned;
  await note.save();

  logger.info(`Note pin toggled by user ${req.user._id}: ${note._id} - ${note.isPinned ? 'pinned' : 'unpinned'}`);

  res.status(200).json({
    success: true,
    message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
    data: {
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    },
  });
});

/**
 * POST /api/notes/:id/archive
 * Toggle archive status of a note
 */
export const toggleArchive = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
  }

  const { id } = req.params;

  const note = await Note.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!note) {
    throw new NotFoundError('Note not found', 'NOTE_NOT_FOUND');
  }

  note.isArchived = !note.isArchived;
  // If archiving, unpin the note
  if (note.isArchived) {
    note.isPinned = false;
  }
  await note.save();

  logger.info(`Note archive toggled by user ${req.user._id}: ${note._id} - ${note.isArchived ? 'archived' : 'unarchived'}`);

  res.status(200).json({
    success: true,
    message: `Note ${note.isArchived ? 'archived' : 'unarchived'} successfully`,
    data: {
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    },
  });
});

/**
 * GET /api/notes/search
 * Search notes
 */
export const searchNotes = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
  }

  const { q } = req.query;
  
  if (!q) {
    throw new ValidationError('Search query is required', 'SEARCH_QUERY_REQUIRED');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const query = {
    userId: req.user._id,
    $text: { $search: q as string },
  };

  const [notes, total] = await Promise.all([
    Note.find(query)
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Note.countDocuments(query),
  ]);

  const pages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    message: 'Search completed successfully',
    data: {
      notes: notes.map(note => ({
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    },
  });
});
