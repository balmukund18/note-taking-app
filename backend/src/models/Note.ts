import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  userId: mongoose.Types.ObjectId;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema: Schema<INote> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must be less than 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [10000, 'Content must be less than 10000 characters'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag must be less than 30 characters'],
    }],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });
noteSchema.index({ userId: 1, isArchived: 1 });
noteSchema.index({ userId: 1, tags: 1 });

// Text index for search functionality
noteSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text',
});

export const Note = mongoose.model<INote>('Note', noteSchema);
