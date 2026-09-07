import fs from 'fs';
import { isMongoConnected, DATA_FILE } from '../config/db.js';
import { Message } from '../models/Message.js';
import { Channel } from '../models/Channel.js';

const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
const generateChannelId = (name) => name.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const defaultChannelsConfig = [
  {
    id: 'general',
    name: 'general',
    topic: 'Team announcements, general queries, and engineering discussions',
    icon: 'Hash',
    createdBy: 'system',
    createdByName: 'System',
    isDefault: true,
  },
  {
    id: 'architecture',
    name: 'architecture',
    topic: 'System design specs, database schemas, and microservice topologies',
    icon: 'Layers',
    createdBy: 'system',
    createdByName: 'System',
    isDefault: true,
  },
  {
    id: 'deployments',
    name: 'deployments',
    topic: 'CI/CD pipeline runs, environment status, and production release tracking',
    icon: 'Rocket',
    createdBy: 'system',
    createdByName: 'System',
    isDefault: true,
  },
  {
    id: 'checklist-qa',
    name: 'checklist-qa',
    topic: 'Radora Next feature checklist verification, bug blockers, and sign-offs',
    icon: 'CheckSquare',
    createdBy: 'system',
    createdByName: 'System',
    isDefault: true,
  },
];

const initialSeedMessages = [
  {
    channel: 'general',
    senderId: 'system-admin',
    senderName: 'Kartikey Pandey',
    senderRole: 'architect_admin',
    department: 'Platform Architecture & Governance',
    content: 'Welcome to the Radora Hub Team Chatroom! 🚀 All team members and architects can collaborate here on our institutional portal builds.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    channel: 'architecture',
    senderId: 'system-admin',
    senderName: 'Kartikey Pandey',
    senderRole: 'architect_admin',
    department: 'Platform Architecture & Governance',
    content: 'Radora Next core architecture is mapped across all 6 portals (Admin, Teacher, Student, Parent, Staff, Finance) and 17 operational workflows. Review the checklist to begin assigned verification modules.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    channel: 'checklist-qa',
    senderId: 'system-admin',
    senderName: 'Kartikey Pandey',
    senderRole: 'architect_admin',
    department: 'Platform Architecture & Governance',
    content: 'Radora Next Feature List (458 items across 76 sections) is actively tracked in our Checklist Engine. Flag any blockers in this channel.',
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
];

class LocalChatStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  read() {
    try {
      if (!fs.existsSync(this.filePath)) return { messages: [], channels: defaultChannelsConfig };
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (!data.messages) data.messages = [];
      if (!data.channels || data.channels.length === 0) {
        data.channels = [...defaultChannelsConfig];
      }
      return data;
    } catch {
      return { messages: [], channels: [...defaultChannelsConfig] };
    }
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }
}

const localChatStore = new LocalChatStore(DATA_FILE);

export const chatService = {
  // Initialize default channels and seed messages
  async initDefaultMessages() {
    try {
      if (isMongoConnected) {
        // Seed channels
        const chanCount = await Channel.countDocuments();
        if (chanCount === 0) {
          for (const ch of defaultChannelsConfig) {
            await Channel.create(ch);
          }
          console.log('[Chat] Default channels seeded into MongoDB.');
        }

        // Seed messages
        const count = await Message.countDocuments();
        if (count === 0) {
          for (const msg of initialSeedMessages) {
            await Message.create(msg);
          }
          console.log('[Chat] Default chat messages seeded into MongoDB.');
        }
      } else {
        const db = localChatStore.read();
        let modified = false;
        if (!db.channels || db.channels.length === 0) {
          db.channels = [...defaultChannelsConfig];
          modified = true;
        }
        if (!db.messages || db.messages.length === 0) {
          db.messages = initialSeedMessages.map(m => ({
            _id: generateMessageId(),
            ...m,
            deletedFor: [],
            isDeletedForEveryone: false,
            updatedAt: m.createdAt,
          }));
          modified = true;
          console.log('[Chat] Default chat messages seeded into local DB.');
        }
        if (modified) {
          localChatStore.write(db);
        }
      }
    } catch (err) {
      console.error('[Chat Init Error]', err.message);
    }
  },

  // Get list of all channels
  async getChannels() {
    if (isMongoConnected) {
      const channels = await Channel.find().sort({ createdAt: 1 });
      if (channels.length > 0) return channels;
      return defaultChannelsConfig;
    }

    const db = localChatStore.read();
    return db.channels || defaultChannelsConfig;
  },

  // Create a new channel
  async createChannel({ name, topic, icon, user }) {
    if (!name || !name.trim()) {
      throw new Error('Channel name is required.');
    }

    const slug = generateChannelId(name);
    if (!slug || slug.length < 2) {
      throw new Error('Channel name must contain at least 2 alphanumeric characters.');
    }

    // Check existing
    const existingChannels = await this.getChannels();
    const duplicate = existingChannels.find(c => c.id === slug || c.name.toLowerCase() === name.trim().toLowerCase());
    if (duplicate) {
      throw new Error(`Channel #${slug} already exists.`);
    }

    const newChannel = {
      id: slug,
      name: slug,
      topic: topic ? topic.trim() : `Channel for ${slug} discussions`,
      icon: icon || 'Hash',
      createdBy: String(user?._id || user?.id || 'system'),
      createdByName: user?.name || 'Team Member',
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected) {
      const saved = await Channel.create(newChannel);
      return saved;
    }

    const db = localChatStore.read();
    if (!db.channels) db.channels = [...defaultChannelsConfig];
    db.channels.push(newChannel);
    localChatStore.write(db);
    return newChannel;
  },

  // Delete a channel (General cannot be deleted; only admin or channel creator can delete)
  async deleteChannel(channelId, user) {
    if (!channelId) throw new Error('Channel ID is required.');
    if (channelId === 'general') {
      throw new Error('The default #general channel cannot be deleted.');
    }

    const channels = await this.getChannels();
    const targetChannel = channels.find(c => c.id === channelId);
    if (!targetChannel) {
      throw new Error(`Channel #${channelId} not found.`);
    }

    if (targetChannel.isDefault && user?.role !== 'architect_admin') {
      throw new Error('Default channels can only be managed by a Chief Architect Admin.');
    }

    const isCreator = String(targetChannel.createdBy) === String(user?._id || user?.id);
    const isAdmin = user?.role === 'architect_admin';

    if (!isCreator && !isAdmin) {
      throw new Error('Permission denied. Only the channel creator or an Architect Admin can delete this channel.');
    }

    // 1. Delete channel definition
    if (isMongoConnected) {
      await Channel.deleteOne({ id: channelId });
      // 2. Delete all messages inside this channel
      await Message.deleteMany({ channel: channelId });
    } else {
      const db = localChatStore.read();
      db.channels = (db.channels || []).filter(c => c.id !== channelId);
      // Remove all messages in channel
      db.messages = (db.messages || []).filter(m => m.channel !== channelId);
      localChatStore.write(db);
    }

    return {
      success: true,
      message: `Channel #${channelId} and its messages have been permanently deleted.`,
      channelId,
    };
  },

  // Get messages for a channel, filtering out messages deleted for the current user
  async getMessages(channel = 'general', userId = null, limit = 100) {
    const currentUserId = userId ? String(userId) : null;

    if (isMongoConnected) {
      const query = {
        channel,
        isDeletedForEveryone: { $ne: true },
      };
      if (currentUserId) {
        query.deletedFor = { $ne: currentUserId };
      }
      return await Message.find(query)
        .sort({ createdAt: 1 })
        .limit(limit);
    }

    const db = localChatStore.read();
    let list = (db.messages || []).filter(m => {
      if (m.channel !== channel) return false;
      if (m.isDeletedForEveryone) return false;
      if (currentUserId && Array.isArray(m.deletedFor) && m.deletedFor.map(String).includes(currentUserId)) {
        return false;
      }
      return true;
    });

    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return list.slice(-limit);
  },

  // Send a new message
  async sendMessage(senderUser, channel = 'general', content) {
    if (!content || !content.trim()) {
      throw new Error('Message content cannot be empty.');
    }

    const msgData = {
      channel: channel || 'general',
      senderId: String(senderUser._id || senderUser.id || 'usr-anonymous'),
      senderName: senderUser.name || 'Team Member',
      senderRole: senderUser.role || 'team_member',
      senderAvatar: senderUser.avatar || '',
      department: senderUser.department || 'Engineering',
      content: content.trim(),
      deletedFor: [],
      isDeletedForEveryone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoConnected) {
      const saved = await Message.create(msgData);
      return saved;
    }

    const db = localChatStore.read();
    if (!db.messages) db.messages = [];
    const newMsg = {
      _id: generateMessageId(),
      ...msgData,
    };
    db.messages.push(newMsg);
    if (db.messages.length > 500) {
      db.messages = db.messages.slice(-500);
    }
    localChatStore.write(db);

    return newMsg;
  },

  // Delete message: scope = 'me' | 'everyone'
  async deleteMessage(messageId, user, scope = 'me') {
    if (!messageId) throw new Error('Message ID is required.');
    const currentUserId = String(user?._id || user?.id);
    const isAdmin = user?.role === 'architect_admin';

    if (isMongoConnected) {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found.');
      }

      const isAuthor = String(message.senderId) === currentUserId;

      if (scope === 'me') {
        // Hide message for current user only
        if (!message.deletedFor.includes(currentUserId)) {
          message.deletedFor.push(currentUserId);
          await message.save();
        }
        return {
          success: true,
          scope: 'me',
          messageId: String(message._id),
          message: 'Message deleted for you.',
        };
      }

      if (scope === 'everyone') {
        // Author or Admin can delete for everyone
        if (!isAuthor && !isAdmin) {
          throw new Error('Permission denied. Only the author or an Architect Admin can delete this message for everyone.');
        }

        // Permanent deletion from database
        await Message.findByIdAndDelete(messageId);
        return {
          success: true,
          scope: 'everyone',
          messageId: String(messageId),
          message: isAdmin && !isAuthor
            ? 'Message permanently deleted by Architect Admin.'
            : 'Message deleted for everyone.',
        };
      }

      throw new Error(`Invalid deletion scope: ${scope}. Allowed scopes are 'me' or 'everyone'.`);
    }

    // Local DB implementation
    const db = localChatStore.read();
    const index = (db.messages || []).findIndex(m => String(m._id) === String(messageId));
    if (index === -1) {
      throw new Error('Message not found.');
    }

    const msg = db.messages[index];
    const isAuthor = String(msg.senderId) === currentUserId;

    if (scope === 'me') {
      if (!msg.deletedFor) msg.deletedFor = [];
      if (!msg.deletedFor.map(String).includes(currentUserId)) {
        msg.deletedFor.push(currentUserId);
      }
      localChatStore.write(db);
      return {
        success: true,
        scope: 'me',
        messageId: String(msg._id),
        message: 'Message deleted for you.',
      };
    }

    if (scope === 'everyone') {
      if (!isAuthor && !isAdmin) {
        throw new Error('Permission denied. Only the author or an Architect Admin can delete this message for everyone.');
      }

      db.messages.splice(index, 1);
      localChatStore.write(db);
      return {
        success: true,
        scope: 'everyone',
        messageId: String(messageId),
        message: isAdmin && !isAuthor
          ? 'Message permanently deleted by Architect Admin.'
          : 'Message deleted for everyone.',
      };
    }

    throw new Error(`Invalid deletion scope: ${scope}. Allowed scopes are 'me' or 'everyone'.`);
  },
};
