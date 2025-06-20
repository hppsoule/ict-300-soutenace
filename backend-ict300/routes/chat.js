import express from 'express';
import { getMessages, sendMessage, markMessagesAsRead, getChatContacts, getAvailableContacts } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

router.get('/messages', authenticateToken, getMessages);
router.post('/messages', authenticateToken, validateRequest(schemas.sendMessage), sendMessage);
router.patch('/messages/read', authenticateToken, markMessagesAsRead);
router.get('/contacts', authenticateToken, getChatContacts);
router.get('/available-contacts', authenticateToken, getAvailableContacts);

export default router;