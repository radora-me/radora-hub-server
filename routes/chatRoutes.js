import express from 'express';
import { chatService } from '../services/chatService.js';
import { socketService } from '../services/socketService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get channels
router.get('/channels', verifyToken, async (req, res, next) => {
  try {
    const channels = await chatService.getChannels();
    res.json({
      success: true,
      channels,
    });
  } catch (err) {
    next(err);
  }
});

// Create a new channel
router.post('/channels', verifyToken, async (req, res, next) => {
  try {
    const { name, topic, icon } = req.body;
    const channel = await chatService.createChannel({
      name,
      topic,
      icon,
      user: req.user,
    });
    socketService.broadcastChatEvent('chat:channel_created', channel);
    res.status(201).json({
      success: true,
      message: `Channel #${channel.name} created successfully.`,
      channel,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// Delete a channel (Admin or Channel Creator)
router.delete('/channels/:id', verifyToken, async (req, res, next) => {
  try {
    const result = await chatService.deleteChannel(req.params.id, req.user);
    socketService.broadcastChatEvent('chat:channel_deleted', { channelId: req.params.id });
    res.json(result);
  } catch (err) {
    const status = err.message.includes('Permission denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: err.message,
    });
  }
});

// Get messages for a channel (filtered for the calling user)
router.get('/messages', verifyToken, async (req, res, next) => {
  try {
    const channel = req.query.channel || 'general';
    const userId = req.user?._id || req.user?.id;
    const messages = await chatService.getMessages(channel, userId);
    res.json({
      success: true,
      channel,
      count: messages.length,
      messages,
    });
  } catch (err) {
    next(err);
  }
});

// Send a message
router.post('/messages', verifyToken, async (req, res, next) => {
  try {
    const { channel, content } = req.body;
    const message = await chatService.sendMessage(req.user, channel, content);
    socketService.broadcastChatEvent('chat:new_message', message);
    socketService.broadcastChatEvent('chat:global_message_notify', { channel, message });
    res.status(201).json({
      success: true,
      message,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// Delete a message (supports scope: 'me' | 'everyone')
router.delete('/messages/:id', verifyToken, async (req, res, next) => {
  try {
    const scope = req.query.scope || req.body.scope || 'me';
    const result = await chatService.deleteMessage(req.params.id, req.user, scope);
    socketService.broadcastChatEvent('chat:message_deleted', result);
    res.json(result);
  } catch (err) {
    const status = err.message.includes('Permission denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
