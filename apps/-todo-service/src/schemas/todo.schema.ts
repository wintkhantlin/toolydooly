import * as mongoose from 'mongoose';

export interface Todo {
  text: string;
  is_done: boolean;
  done_at?: Date;
  user_id: string;
  priority: 1 | 2 | 3;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export const TodoSchema = new mongoose.Schema<Todo>({
  text: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true,
    index: true
  },
  is_done: {
    type: Boolean,
    required: true,
    default: false
  },
  done_at: {
    type: Date,
    default: null
  },
  is_deleted: {
    type: Boolean,
    required: true,
    default: false
  },
  user_id: {
    type: String,
    required: true
  },
  priority: {
    type: Number,
    required: true,
    default: 2
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  updated_at: {
    type: Date,
    required: true,
    default: Date.now
  },
});

TodoSchema.index({ text: 1, user_id: 1, is_done: 1 })
TodoSchema.index({ text: "text", user_id: 1 });
