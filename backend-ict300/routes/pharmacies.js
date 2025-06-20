import express from 'express';
import { getPharmacies, getPharmacyById, createPharmacy, updatePharmacy } from '../controllers/pharmacyController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPharmacies);
router.get('/:pharmacyId', getPharmacyById);
router.post('/', authenticateToken, requireRole(['pharmacist']), createPharmacy);
router.put('/:pharmacyId', authenticateToken, requireRole(['pharmacist', 'admin']), updatePharmacy);

export default router;