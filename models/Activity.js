import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userName: {
      type: String,
      required: true,
      default: 'Team Member',
    },
    userEmail: {
      type: String,
      default: '',
    },
    userRole: {
      type: String,
      enum: ['architect_admin', 'team_member', 'system'],
      default: 'team_member',
    },
    userAvatar: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true, // 'CHECKLIST_ITEM_CHECKED', 'CHECKLIST_ITEM_UNCHECKED', 'PROJECT_STATUS_CHANGED', 'PROJECT_UPDATED', 'PROJECT_CREATED', 'CHECKLIST_ITEM_ADDED', 'TEMPLATE_INSTANTIATED'
    },
    projectId: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    projectTitle: {
      type: String,
      default: '',
    },
    projectCode: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ projectId: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
