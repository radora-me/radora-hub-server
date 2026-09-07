import { Server } from 'socket.io';
import { chatService } from './chatService.js';

let io = null;
const onlineUsers = new Map(); // userId -> { user, socketIds: Set }

export const socketService = {
  init(httpServer) {
    io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => callback(null, true),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    io.on('connection', (socket) => {
      let currentUserId = null;

      // Register authenticated user for presence tracking
      socket.on('user:online', (userData) => {
        if (!userData || (!userData._id && !userData.id)) return;
        currentUserId = String(userData._id || userData.id);

        if (!onlineUsers.has(currentUserId)) {
          onlineUsers.set(currentUserId, {
            user: userData,
            socketIds: new Set([socket.id]),
          });
        } else {
          onlineUsers.get(currentUserId).socketIds.add(socket.id);
        }

        // Broadcast active presence
        this.broadcastOnlineUsers();
      });

      // Join chat channel room
      socket.on('chat:join_channel', (channelId) => {
        if (!channelId) return;
        socket.join(`channel_${channelId}`);
      });

      // Leave chat channel room
      socket.on('chat:leave_channel', (channelId) => {
        if (!channelId) return;
        socket.leave(`channel_${channelId}`);
      });

      // Typing indicator
      socket.on('chat:typing', ({ channel, userName, isTyping }) => {
        if (!channel) return;
        socket.to(`channel_${channel}`).emit('chat:user_typing', {
          channel,
          userName,
          isTyping,
        });
      });

      // Real-time Chat message send
      socket.on('chat:send_message', async ({ channel, content, user }, callback) => {
        try {
          if (!content || !content.trim()) return;
          const msg = await chatService.sendMessage(user, channel, content);
          
          // Emit to all sockets in channel room and also globally for the floating popup widget
          io.to(`channel_${channel}`).emit('chat:new_message', msg);
          io.emit('chat:global_message_notify', {
            channel,
            message: msg,
          });

          if (typeof callback === 'function') {
            callback({ success: true, data: msg });
          }
        } catch (err) {
          if (typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        if (currentUserId && onlineUsers.has(currentUserId)) {
          const entry = onlineUsers.get(currentUserId);
          entry.socketIds.delete(socket.id);
          if (entry.socketIds.size === 0) {
            onlineUsers.delete(currentUserId);
          }
          this.broadcastOnlineUsers();
        }
      });
    });

    console.log('[SocketService] Real-Time Socket.IO server initialized.');
    return io;
  },

  getIO() {
    return io;
  },

  // Broadcast online user presence
  broadcastOnlineUsers() {
    if (!io) return;
    const users = Array.from(onlineUsers.values()).map(e => e.user);
    io.emit('chat:online_users', users);
  },

  // Broadcast platform updates to all connected clients (instant sync with NO reload)
  broadcastPlatformUpdate(type, payload = {}) {
    if (!io) return;
    io.emit('platform:update', {
      type,
      payload,
      timestamp: new Date().toISOString(),
    });
  },

  // Broadcast chat room event (e.g. channel creation, deletion, message deletion)
  broadcastChatEvent(event, data) {
    if (!io) return;
    io.emit(event, data);
  }
};
