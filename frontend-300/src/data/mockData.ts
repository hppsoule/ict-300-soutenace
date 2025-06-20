import { Medicine, Pharmacy, Order, ChatMessage } from '../types';

export const mockPharmacies: Pharmacy[] = [
  {
    id: 'pharmacy-1',
    name: 'Pharmacie du Centre',
    address: {
      street: '45 Avenue des Champs-Élysées',
      city: 'Paris',
      postalCode: '75008',
      country: 'France',
      coordinates: { lat: 48.8698, lng: 2.3080 }
    },
    phone: '+33144567890',
    email: 'contact@pharmaciecentre.fr',
    isOpen: true,
    openingHours: [
      { day: 'Lundi', open: '08:00', close: '20:00' },
      { day: 'Mardi', open: '08:00', close: '20:00' },
      { day: 'Mercredi', open: '08:00', close: '20:00' },
      { day: 'Jeudi', open: '08:00', close: '20:00' },
      { day: 'Vendredi', open: '08:00', close: '20:00' },
      { day: 'Samedi', open: '09:00', close: '19:00' },
      { day: 'Dimanche', open: '10:00', close: '18:00' }
    ],
    rating: 4.8,
    image: 'https://images.pexels.com/photos/305568/pexels-photo-305568.jpeg'
  }
];

export const mockMedicines: Medicine[] = [
  {
    id: 'med-1',
    name: 'Doliprane 1000mg',
    description: 'Paracétamol pour douleurs et fièvre',
    price: 3.50,
    category: 'Antalgiques',
    requiresPrescription: false,
    inStock: true,
    quantity: 150,
    image: 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg',
    pharmacyId: 'pharmacy-1'
  },
  {
    id: 'med-2',
    name: 'Amoxicilline 500mg',
    description: 'Antibiotique à large spectre',
    price: 8.90,
    category: 'Antibiotiques',
    requiresPrescription: true,
    inStock: true,
    quantity: 80,
    image: 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg',
    pharmacyId: 'pharmacy-1'
  },
  {
    id: 'med-3',
    name: 'Cetirizine 10mg',
    description: 'Antihistaminique pour allergies',
    price: 5.20,
    category: 'Antihistaminiques',
    requiresPrescription: false,
    inStock: true,
    quantity: 200,
    image: 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg',
    pharmacyId: 'pharmacy-1'
  },
  {
    id: 'med-4',
    name: 'Ventoline',
    description: 'Bronchodilatateur pour asthme',
    price: 12.50,
    category: 'Respiratoire',
    requiresPrescription: true,
    inStock: true,
    quantity: 45,
    image: 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg',
    pharmacyId: 'pharmacy-1'
  },
  {
    id: 'med-5',
    name: 'Vitamin D3',
    description: 'Complément vitaminique',
    price: 15.80,
    category: 'Vitamines',
    requiresPrescription: false,
    inStock: true,
    quantity: 120,
    image: 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg',
    pharmacyId: 'pharmacy-1'
  }
];

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    patientId: '1',
    pharmacyId: 'pharmacy-1',
    driverId: '3',
    items: [
      {
        medicineId: 'med-1',
        medicine: mockMedicines[0],
        quantity: 2,
        price: 3.50
      }
    ],
    total: 7.00,
    status: 'in_transit',
    deliveryAddress: {
      street: '123 Rue de la Santé',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      coordinates: { lat: 48.8566, lng: 2.3522 }
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    trackingInfo: {
      driverLocation: { lat: 48.8606, lng: 2.3376 },
      estimatedArrival: '2024-01-15T15:00:00Z',
      updates: [
        {
          timestamp: '2024-01-15T10:30:00Z',
          status: 'pending',
          message: 'Commande reçue'
        },
        {
          timestamp: '2024-01-15T11:00:00Z',
          status: 'validated',
          message: 'Commande validée par la pharmacie'
        },
        {
          timestamp: '2024-01-15T14:30:00Z',
          status: 'in_transit',
          message: 'En route vers vous',
          location: { lat: 48.8606, lng: 2.3376 }
        }
      ]
    }
  }
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: '2',
    senderName: 'Marie Martin',
    senderRole: 'pharmacist',
    recipientId: '1',
    message: 'Bonjour, votre commande est prête. Le livreur va bientôt partir.',
    timestamp: '2024-01-15T14:00:00Z',
    orderId: 'order-1'
  },
  {
    id: 'msg-2',
    senderId: '3',
    senderName: 'Pierre Bernard',
    senderRole: 'driver',
    recipientId: '1',
    message: 'Bonjour, je suis en route avec votre commande. J\'arrive dans 15 minutes.',
    timestamp: '2024-01-15T14:30:00Z',
    orderId: 'order-1'
  }
];