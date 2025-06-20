import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  getPendingUsers, 
  approveUser, 
  rejectUser, 
  getAllUsers,
  uploadAvatar,
  updateProfile,
  updateAddress,
  changePassword,
  updateNotificationPreferences
} from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Routes publiques
router.post('/register', validateRequest(schemas.register), register);
router.post('/login', validateRequest(schemas.login), login);

// Routes protégées
router.get('/profile', authenticateToken, getProfile);
router.post('/upload-avatar', authenticateToken, uploadAvatar);
router.patch('/profile', authenticateToken, updateProfile);
router.post('/address', authenticateToken, updateAddress);
router.post('/change-password', authenticateToken, changePassword);
router.patch('/notification-preferences', authenticateToken, updateNotificationPreferences);

// Routes admin uniquement
router.get('/pending-users', authenticateToken, requireRole(['admin']), getPendingUsers);
router.get('/users', authenticateToken, requireRole(['admin']), getAllUsers);
router.patch('/users/:userId/approve', authenticateToken, requireRole(['admin']), approveUser);
router.delete('/users/:userId/reject', authenticateToken, requireRole(['admin']), rejectUser);

export default router;