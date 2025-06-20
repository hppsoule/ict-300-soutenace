export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'patient' | 'pharmacist' | 'driver' | 'admin';
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  address?: Address;
  pharmacyId?: string;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Pharmacy {
  id: string;
  name: string;
  address: Address;
  phone: string;
  email: string;
  isOpen: boolean;
  openingHours: OpeningHours[];
  rating: number;
  image?: string;
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
}

export interface Medicine {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: string;
  requiresPrescription: boolean;
  inStock: boolean;
  quantity: number;
  imageUrl?: string;
  pharmacyId: string;
  pharmacyName?: string;
  manufacturer?: string;
  expiryDate?: string;
  barcode?: string;
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export interface Order {
  id: string;
  patientId: string;
  pharmacyId: string;
  driverId?: string;
  patientName?: string;
  pharmacyName?: string;
  driverName?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  prescriptionUrl?: string;
  rejectionReason?: string;
  deliveryAddress: Address;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryFee?: number;
  estimatedDelivery?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  trackingInfo?: TrackingInfo;
}

export interface OrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  requiresPrescription?: boolean;
}

export type OrderStatus = 
  | 'pending' 
  | 'validated' 
  | 'rejected' 
  | 'paid' 
  | 'preparing' 
  | 'ready' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled';

export interface TrackingInfo {
  driverLocation?: {
    lat: number;
    lng: number;
  };
  estimatedArrival?: string;
  updates: TrackingUpdate[];
}

export interface TrackingUpdate {
  timestamp: string;
  status: string;
  message: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  message: string;
  timestamp: string;
  orderId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  orderId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  address?: Address;
  pharmacistProfile?: PharmacistProfile;
  driverProfile?: DriverProfile;
}

export interface PharmacistProfile {
  licenseNumber: string;
  pharmacyDegree?: string;
  specialization?: string;
  yearsExperience?: number;
  professionalOrderNumber?: string;
}

export interface DriverProfile {
  licenseNumber: string;
  licenseType: string;
  licenseExpiryDate: string;
  vehicleType?: string;
  vehicleRegistration?: string;
  insuranceNumber?: string;
  insuranceExpiryDate?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export interface Prescription {
  id: string;
  orderId: string;
  patientId: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}