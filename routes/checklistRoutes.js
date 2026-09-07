import express from 'express';
import {
  getChecklists,
  getChecklistById,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  updateChecklistItem,
  addSection,
  addItem,
  deleteItem,
  bulkAction
} from '../controllers/checklistController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(optionalAuth);

router.route('/')
  .get(getChecklists)
  .post(createChecklist);

router.route('/:id')
  .get(getChecklistById)
  .put(updateChecklist)
  .delete(deleteChecklist);

router.route('/:id/bulk')
  .post(bulkAction);

router.route('/:id/sections')
  .post(addSection);

router.route('/:id/sections/:sectionId/items')
  .post(addItem);

router.route('/:id/sections/:sectionId/items/:itemId')
  .put(updateChecklistItem)
  .delete(deleteItem);

export default router;
