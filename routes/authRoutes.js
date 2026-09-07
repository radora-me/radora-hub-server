import express from 'express';
import { authService } from '../services/authService.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: Login
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    res.json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: err.message || 'Authentication failed',
    });
  }
});

// Authenticated: Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Authenticated: Change own password
router.put('/change-password', verifyToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;
    const result = await authService.changeSelfPassword(userId, currentPassword, newPassword);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// Authenticated: Get all team members roster
router.get('/users', verifyToken, async (req, res, next) => {
  try {
    const users = await authService.getAllUsers();
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
});

// Authenticated: Get single team member profile
router.get('/users/:id', verifyToken, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// Admin Only: Create new team member profile
router.post('/users', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const newUser = await authService.createUser(req.user, req.body);
    res.status(201).json({
      success: true,
      message: `Team member ${newUser.name} created successfully!`,
      user: newUser,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// Admin Only: Update team member profile
router.put('/users/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const updated = await authService.updateUserProfile(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// Admin Only: Change / Reset Password of any team member
router.put('/users/:id/password', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const result = await authService.changeUserPasswordByAdmin(req.user, req.params.id, newPassword);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// Admin Only: Delete team member
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await authService.deleteUser(req.user, req.params.id);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
