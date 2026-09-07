import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
    },
    topic: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: 'Hash',
    },
    createdBy: {
      type: String,
      default: 'system',
    },
    createdByName: {
      type: String,
      default: 'System',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Channel = mongoose.model('Channel', channelSchema);
export default Channel;
