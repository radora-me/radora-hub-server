import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Engineering', 'Cloud Ops', 'Security & Audit', 'Client Onboarding', 'Quality Assurance', 'Product', 'Infrastructure', 'General'],
      default: 'Engineering',
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'Under Review', 'Completed', 'On Hold'],
      default: 'Planning',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    lead: {
      type: String,
      default: 'Radora Lead',
    },
    team: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    startDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    targetDate: {
      type: String,
      default: '',
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

export const Project = mongoose.model('Project', ProjectSchema);
