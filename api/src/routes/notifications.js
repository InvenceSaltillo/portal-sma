import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listMyNotifications,
  markNotificationAsRead,
} from '../controllers/notifications.controller.js';

const router = express.Router();

router.get('/', authenticate, listMyNotifications);
router.patch('/:id/read', authenticate, markNotificationAsRead);

export default router;
