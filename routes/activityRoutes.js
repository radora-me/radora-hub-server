import express from 'express';
import { getActivities, getActivityStats } from '../controllers/activityController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getActivities);
router.get('/stats', optionalAuth, getActivityStats);

export default router;
