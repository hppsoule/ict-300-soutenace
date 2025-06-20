import express from 'express';
import { 
  acceptDelivery, 
  updateDeliveryLocation, 
  completeDelivery, 
  getAvailableDeliveries,
  getAvailableDrivers,
  getDriverStats,
  getDeliveryHistory
} from '../controllers/deliveryController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Routes pour les livreurs
router.get('/available', authenticateToken, requireRole(['driver', 'pharmacist', 'admin']), getAvailableDeliveries);
router.get('/available-drivers', authenticateToken, requireRole(['pharmacist', 'admin']), getAvailableDrivers);
router.post('/:orderId/accept', authenticateToken, requireRole(['driver']), acceptDelivery);
router.post('/:orderId/complete', authenticateToken, requireRole(['driver']), validateRequest(schemas.completeDelivery), completeDelivery);
router.post('/location', authenticateToken, requireRole(['driver']), validateRequest(schemas.updateLocation), updateDeliveryLocation);
router.get('/stats', authenticateToken, requireRole(['driver']), getDriverStats);
router.get('/history', authenticateToken, requireRole(['driver']), getDeliveryHistory);

export default router;