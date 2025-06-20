import express from 'express';
import { upload, uploadBase64Image, deleteImage } from '../utils/cloudinary.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Upload d'image via formulaire multipart
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    res.json({
      message: 'Image uploadée avec succès',
      imageUrl: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Erreur upload image:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload de l\'image' });
  }
});

// Upload d'image via base64
router.post('/image/base64', authenticateToken, async (req, res) => {
  try {
    const { imageData, folder = 'general' } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Données d\'image manquantes' });
    }

    // Vérifier que c'est bien du base64
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Format d\'image invalide' });
    }

    const result = await uploadBase64Image(imageData, folder);

    res.json({
      message: 'Image uploadée avec succès',
      imageUrl: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Erreur upload base64:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'upload de l\'image' });
  }
});

// Suppression d'image
router.delete('/image/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Décoder le publicId (il peut être encodé dans l'URL)
    const decodedPublicId = decodeURIComponent(publicId);
    
    const result = await deleteImage(decodedPublicId);

    if (result.result === 'ok') {
      res.json({ message: 'Image supprimée avec succès' });
    } else {
      res.status(404).json({ error: 'Image non trouvée' });
    }
  } catch (error) {
    console.error('Erreur suppression image:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'image' });
  }
});

export default router;