import Joi from 'joi';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Erreur de validation',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Schémas de validation
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'L\'email doit être valide',
      'any.required': 'L\'email est requis'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'any.required': 'Le mot de passe est requis'
    }),
    firstName: Joi.string().min(2).required().messages({
      'string.min': 'Le prénom doit contenir au moins 2 caractères',
      'any.required': 'Le prénom est requis'
    }),
    lastName: Joi.string().min(2).required().messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'any.required': 'Le nom est requis'
    }),
    phone: Joi.string().optional(),
    role: Joi.string().valid('patient', 'pharmacist', 'driver').required().messages({
      'any.only': 'Le rôle doit être patient, pharmacist ou driver',
      'any.required': 'Le rôle est requis'
    }),
    
    // Champs spécifiques aux pharmaciens
    licenseNumber: Joi.when('role', {
      is: 'pharmacist',
      then: Joi.string().required().messages({
        'any.required': 'Le numéro de licence est requis pour les pharmaciens'
      }),
      otherwise: Joi.when('role', {
        is: 'driver',
        then: Joi.string().required().messages({
          'any.required': 'Le numéro de permis est requis pour les livreurs'
        }),
        otherwise: Joi.string().optional()
      })
    }),
    pharmacyDegree: Joi.when('role', {
      is: 'pharmacist',
      then: Joi.string().optional(),
      otherwise: Joi.forbidden()
    }),
    specialization: Joi.when('role', {
      is: 'pharmacist',
      then: Joi.string().optional(),
      otherwise: Joi.forbidden()
    }),
    yearsExperience: Joi.when('role', {
      is: 'pharmacist',
      then: Joi.number().integer().min(0).optional(),
      otherwise: Joi.forbidden()
    }),
    professionalOrderNumber: Joi.when('role', {
      is: 'pharmacist',
      then: Joi.string().optional(),
      otherwise: Joi.forbidden()
    }),
    
    // Champs spécifiques aux livreurs
    licenseType: Joi.when('role', {
      is: 'driver',
      then: Joi.string().valid('A', 'A1', 'A2', 'B', 'BE', 'C', 'CE', 'D', 'DE').required().messages({
        'any.required': 'Le type de permis est requis pour les livreurs'
      }),
      otherwise: Joi.forbidden()
    }),
    licenseExpiryDate: Joi.when('role', {
      is: 'driver',
      then: Joi.date().greater('now').required().messages({
        'any.required': 'La date d\'expiration du permis est requise',
        'date.greater': 'Le permis ne doit pas être expiré'
      }),
      otherwise: Joi.forbidden()
    }),
    vehicleType: Joi.when('role', {
      is: 'driver',
      then: Joi.string().valid('vélo', 'moto', 'voiture', 'camionnette').optional(),
      otherwise: Joi.forbidden()
    }),
    vehicleRegistration: Joi.when('role', {
      is: 'driver',
      then: Joi.string().optional(),
      otherwise: Joi.forbidden()
    }),
    insuranceNumber: Joi.when('role', {
      is: 'driver',
      then: Joi.string().optional(),
      otherwise: Joi.forbidden()
    }),
    insuranceExpiryDate: Joi.when('role', {
      is: 'driver',
      then: Joi.date().greater('now').optional().messages({
        'date.greater': 'L\'assurance ne doit pas être expirée'
      }),
      otherwise: Joi.forbidden()
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'L\'email doit être valide',
      'any.required': 'L\'email est requis'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Le mot de passe est requis'
    })
  }),

  createOrder: Joi.object({
    pharmacyId: Joi.string().uuid().required(),
    items: Joi.array().items(
      Joi.object({
        medicineId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required()
      })
    ).min(1).required(),
    deliveryAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().required(),
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional()
    }).required(),
    prescriptionUrl: Joi.string().uri().optional()
  }),

  // Schéma corrigé et strict pour updateOrderStatus
  updateOrderStatus: Joi.object({
    status: Joi.string()
      .valid('pending', 'validated', 'rejected', 'paid', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled')
      .required()
      .messages({
        'any.only': 'Le statut doit être l\'une des valeurs suivantes: pending, validated, rejected, paid, preparing, ready, in_transit, delivered, cancelled',
        'any.required': 'Le statut est requis'
      }),
    rejectionReason: Joi.when('status', {
      is: 'rejected',
      then: Joi.string().min(3).max(500).required().messages({
        'string.min': 'La raison du rejet doit contenir au moins 3 caractères',
        'string.max': 'La raison du rejet ne peut pas dépasser 500 caractères',
        'any.required': 'La raison du rejet est requise quand le statut est "rejected"'
      }),
      otherwise: Joi.string().max(500).optional().allow('', null).messages({
        'string.max': 'La raison du rejet ne peut pas dépasser 500 caractères'
      })
    }),
    driverId: Joi.string().uuid().optional()
  }).options({ stripUnknown: true }),

  // Schéma pour l'assignation d'un livreur
  assignDriver: Joi.object({
    driverId: Joi.string().uuid().required().messages({
      'any.required': 'L\'ID du livreur est requis',
      'string.guid': 'Format d\'ID de livreur invalide'
    })
  }),

  // Nouveau schéma pour la mise à jour de l'ordonnance
  updateOrderPrescription: Joi.object({
    prescriptionUrl: Joi.string().uri().required().messages({
      'string.uri': 'L\'URL de l\'ordonnance doit être valide',
      'any.required': 'L\'URL de l\'ordonnance est requise'
    })
  }),

  // Nouveau schéma pour le paiement
  processPayment: Joi.object({
    orderId: Joi.string().uuid().required().messages({
      'any.required': 'L\'ID de commande est requis',
      'string.guid': 'Format d\'ID de commande invalide'
    }),
    paymentMethod: Joi.string().valid('card', 'paypal', 'apple_pay', 'google_pay').required().messages({
      'any.only': 'Méthode de paiement non supportée',
      'any.required': 'La méthode de paiement est requise'
    }),
    paymentData: Joi.object({
      cardNumber: Joi.when('...paymentMethod', {
        is: 'card',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
      }),
      expiryDate: Joi.when('...paymentMethod', {
        is: 'card',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
      }),
      cvv: Joi.when('...paymentMethod', {
        is: 'card',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
      }),
      holderName: Joi.when('...paymentMethod', {
        is: 'card',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
      }),
      // Pour PayPal, Apple Pay, Google Pay
      token: Joi.when('...paymentMethod', {
        is: Joi.string().valid('paypal', 'apple_pay', 'google_pay'),
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
      })
    }).optional()
  }),

  // Schéma pour la finalisation de livraison
  completeDelivery: Joi.object({
    deliveryNotes: Joi.string().max(500).optional().allow(''),
    customerSignature: Joi.string().optional().allow(''),
    deliveryPhoto: Joi.string().optional().allow('')
  }),

  // Schéma pour la mise à jour de position
  updateLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required().messages({
      'number.min': 'Latitude invalide',
      'number.max': 'Latitude invalide',
      'any.required': 'La latitude est requise'
    }),
    longitude: Joi.number().min(-180).max(180).required().messages({
      'number.min': 'Longitude invalide',
      'number.max': 'Longitude invalide',
      'any.required': 'La longitude est requise'
    })
  }),

  createMedicine: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Le nom du médicament est requis'
    }),
    description: Joi.string().optional().allow(''),
    price: Joi.number().positive().required().messages({
      'number.positive': 'Le prix doit être supérieur à 0',
      'any.required': 'Le prix est requis'
    }),
    categoryId: Joi.string().uuid().required().messages({
      'any.required': 'La catégorie est requise'
    }),
    requiresPrescription: Joi.boolean().default(false),
    quantity: Joi.number().integer().min(0).required().messages({
      'number.min': 'La quantité doit être supérieure ou égale à 0',
      'any.required': 'La quantité est requise'
    }),
    manufacturer: Joi.string().optional().allow(''),
    expiryDate: Joi.date().optional().allow(null),
    barcode: Joi.string().optional().allow(''),
    imageUrl: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'L\'URL de l\'image doit être valide'
    })
  }),

  sendMessage: Joi.object({
    recipientId: Joi.string().uuid().required(),
    message: Joi.string().required(),
    orderId: Joi.string().uuid().optional()
  }),

  createPharmacy: Joi.object({
    name: Joi.string().required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().required(),
      coordinates: Joi.object({
        lat: Joi.number().optional(),
        lng: Joi.number().optional()
      }).optional()
    }).required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    licenseNumber: Joi.string().required(),
    openingHours: Joi.array().items(
      Joi.object({
        day: Joi.number().min(0).max(6).required(),
        openTime: Joi.string().required(),
        closeTime: Joi.string().required(),
        isClosed: Joi.boolean().default(false)
      })
    ).optional()
  })
};