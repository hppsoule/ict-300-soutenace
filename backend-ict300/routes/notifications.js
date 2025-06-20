import express from 'express';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification 
} from '../utils/notifications.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.patch('/:notificationId/read', authenticateToken, markNotificationAsRead);
router.patch('/mark-all-read', authenticateToken, markAllNotificationsAsRead);
router.delete('/:notificationId', authenticateToken, deleteNotification);

export default router;