import express from 'express';
import { 
  getMedicines, 
  getMedicineById, 
  createMedicine, 
  updateMedicine, 
  deleteMedicine,
  getCategories,
  updateMedicineStock,
  getPharmacistMedicines
} from '../controllers/medicineController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Routes publiques (pour les patients)
router.get('/', getMedicines);
router.get('/categories', getCategories);

// Routes pour les pharmaciens - IMPORTANT: Ces routes doivent être AVANT la route /:medicineId
router.get('/pharmacist/my-medicines', authenticateToken, requireRole(['pharmacist']), getPharmacistMedicines);
router.post('/', authenticateToken, requireRole(['pharmacist']), validateRequest(schemas.createMedicine), createMedicine);
router.put('/:medicineId', authenticateToken, requireRole(['pharmacist', 'admin']), updateMedicine);
router.delete('/:medicineId', authenticateToken, requireRole(['pharmacist', 'admin']), deleteMedicine);
router.patch('/:medicineId/stock', authenticateToken, requireRole(['pharmacist', 'admin']), updateMedicineStock);

// Route avec paramètre dynamique - DOIT être en dernier
router.get('/:medicineId', getMedicineById);

export default router;