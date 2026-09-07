import express from 'express';
import { getAnalytics, resetData } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/stats', getAnalytics);
router.post('/reset', resetData);

export default router;
