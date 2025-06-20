import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import apiService from '../../services/api';

interface PrescriptionUploadModalProps {
  onClose: () => void;
  onUploadComplete: (prescriptionUrl: string) => void;
  orderId?: string;
}

const PrescriptionUploadModal: React.FC<PrescriptionUploadModalProps> = ({ 
  onClose, 
  onUploadComplete,
  orderId 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier le type de fichier (image ou PDF)
      if (!selectedFile.type.match('image.*') && selectedFile.type !== 'application/pdf') {
        setError('Veuillez sélectionner une image ou un PDF');
        return;
      }

      // Vérifier la taille du fichier (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Le fichier est trop volumineux (max 5MB)');
        return;
      }

      setFile(selectedFile);
      setError(null);

      // Créer un aperçu pour les images
      if (selectedFile.type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // Pour les PDF, afficher une icône
        setPreview(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // Vérifier le type de fichier (image ou PDF)
      if (!droppedFile.type.match('image.*') && droppedFile.type !== 'application/pdf') {
        setError('Veuillez sélectionner une image ou un PDF');
        return;
      }

      // Vérifier la taille du fichier (max 5MB)
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('Le fichier est trop volumineux (max 5MB)');
        return;
      }

      setFile(droppedFile);
      setError(null);

      // Créer un aperçu pour les images
      if (droppedFile.type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(droppedFile);
      } else {
        // Pour les PDF, afficher une icône
        setPreview(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload du fichier vers Cloudinary via notre API
      const uploadResult = await apiService.uploadImageFile(file, 'prescriptions');
      
      // Si l'upload est réussi, on appelle le callback avec l'URL
      if (uploadResult && uploadResult.imageUrl) {
        setSuccess(true);
        
        // Si un orderId est fourni, mettre à jour l'ordonnance de la commande
        if (orderId) {
          await apiService.updateOrderPrescription(orderId, uploadResult.imageUrl);
        }
        
        // Attendre un peu pour montrer le message de succès
        setTimeout(() => {
          onUploadComplete(uploadResult.imageUrl);
        }, 1500);
      } else {
        throw new Error('Erreur lors de l\'upload');
      }
    } catch (err: any) {
      console.error('Erreur upload ordonnance:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCapture = async () => {
    try {
      // Vérifier si l'API mediaDevices est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Votre navigateur ne supporte pas la capture d\'image');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Créer un élément vidéo temporaire
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Attendre que la vidéo soit chargée
      video.onloadedmetadata = () => {
        // Créer un canvas pour capturer l'image
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Dessiner l'image sur le canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convertir le canvas en blob
          canvas.toBlob((blob) => {
            if (blob) {
              // Arrêter tous les tracks de la vidéo
              stream.getTracks().forEach(track => track.stop());
              
              // Créer un fichier à partir du blob
              const capturedFile = new File([blob], 'ordonnance.jpg', { type: 'image/jpeg' });
              setFile(capturedFile);
              setPreview(canvas.toDataURL('image/jpeg'));
              setError(null);
            }
          }, 'image/jpeg', 0.9);
        }
      };
    } catch (err: any) {
      console.error('Erreur capture:', err);
      setError('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Téléchargement d'ordonnance</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-red-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="mt-2 text-red-100">
            Certains médicaments nécessitent une ordonnance valide
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ordonnance téléchargée</h3>
              <p className="text-gray-600">
                Votre ordonnance a été téléchargée avec succès et sera vérifiée par un pharmacien.
              </p>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Prenez une photo claire et lisible de votre ordonnance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Assurez-vous que tous les médicaments et dosages sont visibles</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Formats acceptés : JPG, PNG, PDF (max 5MB)</span>
                  </li>
                </ul>
              </div>

              {/* Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                } transition-colors cursor-pointer`}
                onClick={triggerFileInput}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,application/pdf"
                />
                
                {preview ? (
                  <div className="mb-4">
                    <img 
                      src={preview} 
                      alt="Aperçu de l'ordonnance" 
                      className="max-h-48 mx-auto rounded-lg border border-gray-200"
                    />
                  </div>
                ) : file && file.type === 'application/pdf' ? (
                  <div className="mb-4">
                    <div className="w-24 h-24 bg-red-100 rounded-lg flex items-center justify-center mx-auto">
                      <FileText className="h-12 w-12 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{file.name}</p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="h-8 w-8 text-gray-500" />
                    </div>
                  </div>
                )}

                <p className="text-gray-700 font-medium mb-2">
                  {file ? 'Changer de fichier' : 'Glissez-déposez votre ordonnance ici'}
                </p>
                <p className="text-sm text-gray-500">
                  {file ? file.name : 'ou cliquez pour parcourir vos fichiers'}
                </p>
              </div>

              {/* Camera Capture Button */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleCapture}
                  className="w-full flex items-center justify-center bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-3 rounded-xl font-medium transition-colors"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Prendre une photo avec la caméra
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center text-red-700">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center ${
                    !file || uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-blue-600 text-white hover:from-red-600 hover:to-blue-700'
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Télécharger
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>Vos données médicales sont sécurisées et protégées</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUploadModal;