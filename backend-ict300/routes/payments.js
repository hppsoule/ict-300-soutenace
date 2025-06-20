import express from 'express';
import { processPayment, validatePayment, getPaymentMethods } from '../controllers/paymentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Routes pour les patients
router.post('/process', authenticateToken, requireRole(['patient']), processPayment);
router.get('/methods', authenticateToken, getPaymentMethods);

// Routes pour les pharmaciens
router.post('/:orderId/validate', authenticateToken, requireRole(['pharmacist']), validatePayment);

export default router;