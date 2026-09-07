import mongoose from 'mongoose';

const ChecklistItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Blocked', 'Skipped'],
    default: 'Pending',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  assignee: {
    type: String,
    default: '',
  },
  dueDate: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  completedAt: {
    type: String,
    default: null,
  }
});

const ChecklistSectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  items: [ChecklistItemSchema],
});

const ChecklistSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    },
    projectId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    templateId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Template',
      default: null,
    },
    category: {
      type: String,
      default: 'General',
    },
    sections: [ChecklistSectionSchema],
    totalItems: {
      type: Number,
      default: 0,
    },
    completedItems: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

export const Checklist = mongoose.model('Checklist', ChecklistSchema);
