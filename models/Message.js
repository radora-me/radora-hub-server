import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      default: 'general',
      required: true,
      trim: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['architect_admin', 'team_member'],
      default: 'team_member',
    },
    senderAvatar: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
    },
    deletedFor: {
      type: [String],
      default: [],
    },
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    systemGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model('Message', messageSchema);
export default Message;
