const API_BASE_URL = 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiService {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('pharmaDeliveryToken');
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('pharmaDeliveryToken', token);
      // Stocker l'ID de l'utilisateur pour les références futures
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userId) {
          localStorage.setItem('userId', payload.userId);
        }
      } catch (e) {
        console.error('Erreur lors du décodage du token:', e);
      }
    } else {
      localStorage.removeItem('pharmaDeliveryToken');
      localStorage.removeItem('userId');
    }
  }

  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers!.Authorization = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Vérifier si la réponse est en JSON
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Si ce n'est pas du JSON, récupérer le texte
        const text = await response.text();
        console.error('Response is not JSON:', text);
        throw new Error('Le serveur a retourné une réponse invalide');
      }

      if (!response.ok) {
        // Gérer les différents types d'erreurs
        if (data.code === 'ACCOUNT_PENDING') {
          throw new Error('Votre compte est en attente d\'approbation par un administrateur');
        }
        throw new Error(data.error || `Erreur HTTP ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('API request failed:', error);
      
      // Gérer les erreurs de réseau
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré.');
      }
      
      throw error;
    }
  }

  // Upload methods
  async uploadImageBase64(imageData: string, folder: string = 'general'): Promise<any> {
    return this.request('/upload/image/base64', {
      method: 'POST',
      body: { imageData, folder },
    });
  }

  async uploadImageFile(file: File, folder: string = 'general'): Promise<any> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const config = {
      method: 'POST',
      headers: {},
      body: formData,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload/image`, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async deleteImage(publicId: string): Promise<any> {
    return this.request(`/upload/image/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
    });
  }

  // Auth methods
  async login(email: string, password: string): Promise<any> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData: any): Promise<any> {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getProfile(): Promise<any> {
    return this.request('/auth/profile');
  }

  async uploadAvatar(avatarData: any): Promise<any> {
    return this.request('/auth/upload-avatar', {
      method: 'POST',
      body: avatarData,
    });
  }

  async updateProfile(profileData: any): Promise<any> {
    return this.request('/auth/profile', {
      method: 'PATCH',
      body: profileData,
    });
  }

  async updateAddress(addressData: any): Promise<any> {
    return this.request('/auth/address', {
      method: 'POST',
      body: addressData,
    });
  }

  async changePassword(passwordData: any): Promise<any> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: passwordData,
    });
  }

  async updateNotificationPreferences(preferencesData: any): Promise<any> {
    return this.request('/auth/notification-preferences', {
      method: 'PATCH',
      body: preferencesData,
    });
  }

  // Admin methods
  async getPendingUsers(): Promise<any[]> {
    return this.request('/auth/pending-users');
  }

  async getAllUsers(params: Record<string, string> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/auth/users${queryString ? `?${queryString}` : ''}`);
  }

  async approveUser(userId: string): Promise<any> {
    return this.request(`/auth/users/${userId}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectUser(userId: string, reason: string | null = null): Promise<any> {
    return this.request(`/auth/users/${userId}/reject`, {
      method: 'DELETE',
      body: { reason },
    });
  }

  // Nouvelle méthode pour supprimer un utilisateur (simulée avec rejectUser)
  async deleteUser(userId: string): Promise<any> {
    return this.request(`/auth/users/${userId}/reject`, {
      method: 'DELETE',
      body: { reason: "Compte supprimé par l'administrateur" },
    });
  }

  // Order methods
  async createOrder(orderData: any): Promise<any> {
    return this.request('/orders', {
      method: 'POST',
      body: orderData,
    });
  }

  async getOrders(): Promise<any[]> {
    return this.request('/orders');
  }

  async getOrderById(orderId: string): Promise<any> {
    return this.request(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: string, status: string, rejectionReason?: string): Promise<any> {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: { status, rejectionReason },
    });
  }

  // Nouvelle méthode pour assigner un livreur à une commande
  async assignDriver(orderId: string, driverId: string): Promise<any> {
    return this.request(`/orders/${orderId}/assign-driver`, {
      method: 'POST',
      body: { driverId },
    });
  }

  async updateOrderPrescription(orderId: string, prescriptionUrl: string): Promise<any> {
    return this.request(`/orders/${orderId}/prescription`, {
      method: 'PATCH',
      body: { prescriptionUrl },
    });
  }

  // Payment methods
  async processPayment(paymentData: any): Promise<any> {
    return this.request('/payments/process', {
      method: 'POST',
      body: paymentData,
    });
  }

  async validatePayment(orderId: string): Promise<any> {
    return this.request(`/payments/${orderId}/validate`, {
      method: 'POST',
    });
  }

  async getPaymentMethods(): Promise<any[]> {
    return this.request('/payments/methods');
  }

  // Delivery methods
  async getAvailableDeliveries(): Promise<any[]> {
    return this.request('/deliveries/available');
  }

  async getAvailableDrivers(): Promise<any[]> {
    return this.request('/deliveries/available-drivers');
  }

  async acceptDelivery(orderId: string): Promise<any> {
    return this.request(`/deliveries/${orderId}/accept`, {
      method: 'POST',
    });
  }

  async completeDelivery(orderId: string, deliveryData: any = {}): Promise<any> {
    return this.request(`/deliveries/${orderId}/complete`, {
      method: 'POST',
      body: deliveryData,
    });
  }

  async updateDriverLocation(latitude: number, longitude: number): Promise<any> {
    return this.request('/deliveries/location', {
      method: 'POST',
      body: { latitude, longitude },
    });
  }

  async getDriverStats(): Promise<any> {
    return this.request('/deliveries/stats');
  }

  // Méthode pour récupérer l'historique des livraisons
  async getDeliveryHistory(params: Record<string, string> = {}): Promise<any[]> {
    // Utiliser getOrders et filtrer côté client
    const orders = await this.getOrders();
    const userId = localStorage.getItem('userId');
    
    // Filtrer pour ne garder que les livraisons du livreur connecté
    const driverOrders = orders.filter((order: any) => 
      order.driverId === userId && order.status === 'delivered'
    );
    
    // Appliquer les filtres supplémentaires
    return driverOrders.map((order: any) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      deliveryFee: 5.00,
      pharmacy: {
        name: order.pharmacyName
      },
      delivery: {
        address: `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`,
        customer: order.patientName
      },
      itemCount: order.items.length,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      updatedAt: order.updatedAt,
      earnings: 5.00
    }));
  }

  // Medicine methods
  async getMedicines(params: Record<string, string> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/medicines${queryString ? `?${queryString}` : ''}`);
  }

  // Nouvelle méthode pour récupérer les médicaments d'un pharmacien
  async getPharmacistMedicines(params: Record<string, string> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/medicines/pharmacist/my-medicines${queryString ? `?${queryString}` : ''}`);
  }

  async getMedicineById(medicineId: string): Promise<any> {
    return this.request(`/medicines/${medicineId}`);
  }

  async createMedicine(medicineData: any): Promise<any> {
    return this.request('/medicines', {
      method: 'POST',
      body: medicineData,
    });
  }

  async updateMedicine(medicineId: string, medicineData: any): Promise<any> {
    return this.request(`/medicines/${medicineId}`, {
      method: 'PUT',
      body: medicineData,
    });
  }

  async deleteMedicine(medicineId: string): Promise<any> {
    return this.request(`/medicines/${medicineId}`, {
      method: 'DELETE',
    });
  }

  async updateMedicineStock(medicineId: string, quantity: number, operation: string = 'set'): Promise<any> {
    return this.request(`/medicines/${medicineId}/stock`, {
      method: 'PATCH',
      body: { quantity, operation },
    });
  }

  async getMedicineCategories(): Promise<any[]> {
    return this.request('/medicines/categories');
  }

  // Pharmacy methods
  async getPharmacies(params: Record<string, string> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/pharmacies${queryString ? `?${queryString}` : ''}`);
  }

  async getPharmacyById(pharmacyId: string): Promise<any> {
    return this.request(`/pharmacies/${pharmacyId}`);
  }

  async createPharmacy(pharmacyData: any): Promise<any> {
    return this.request('/pharmacies', {
      method: 'POST',
      body: pharmacyData,
    });
  }

  async updatePharmacy(pharmacyId: string, pharmacyData: any): Promise<any> {
    return this.request(`/pharmacies/${pharmacyId}`, {
      method: 'PUT',
      body: pharmacyData,
    });
  }

  // Nouvelle méthode pour supprimer une pharmacie (simulée avec updatePharmacy)
  async deletePharmacy(pharmacyId: string): Promise<any> {
    return this.request(`/pharmacies/${pharmacyId}`, {
      method: 'PUT',
      body: { isApproved: false, isOpen: false },
    });
  }

  // Chat methods
  async getMessages(params: Record<string, string> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/chat/messages${queryString ? `?${queryString}` : ''}`);
  }

  async sendMessage(messageData: any): Promise<any> {
    return this.request('/chat/messages', {
      method: 'POST',
      body: messageData,
    });
  }

  async markMessagesAsRead(senderId: string, orderId?: string): Promise<any> {
    return this.request('/chat/messages/read', {
      method: 'PATCH',
      body: { senderId, orderId },
    });
  }

  async getChatContacts(): Promise<any[]> {
    return this.request('/chat/contacts');
  }

  async getAvailableContacts(): Promise<any[]> {
    return this.request('/chat/available-contacts');
  }

  // Notification methods
  async getNotifications(params: Record<string, string> = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<any> {
    return this.request('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  }

  async deleteNotification(notificationId: string): Promise<any> {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  logout(): void {
    this.setToken(null);
  }
}

export default new ApiService();