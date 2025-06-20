const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('pharmaDeliveryToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('pharmaDeliveryToken', token);
    } else {
      localStorage.removeItem('pharmaDeliveryToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Vérifier si la réponse est en JSON
      const contentType = response.headers.get('content-type');
      let data;
      
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
    } catch (error) {
      console.error('API request failed:', error);
      
      // Gérer les erreurs de réseau
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré.');
      }
      
      throw error;
    }
  }

  // Upload methods
  async uploadImageBase64(imageData, folder = 'general') {
    return this.request('/upload/image/base64', {
      method: 'POST',
      body: { imageData, folder },
    });
  }

  async uploadImageFile(file, folder = 'general') {
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

  async deleteImage(publicId) {
    return this.request(`/upload/image/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
    });
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Admin methods
  async getPendingUsers() {
    return this.request('/auth/pending-users');
  }

  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/auth/users${queryString ? `?${queryString}` : ''}`);
  }

  async approveUser(userId) {
    return this.request(`/auth/users/${userId}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectUser(userId, reason = null) {
    return this.request(`/auth/users/${userId}/reject`, {
      method: 'DELETE',
      body: { reason },
    });
  }

  // Order methods
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: orderData,
    });
  }

  async getOrders() {
    return this.request('/orders');
  }

  async getOrderById(orderId) {
    return this.request(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId, status, rejectionReason = null) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: { status, rejectionReason },
    });
  }

  // Nouvelle méthode pour mettre à jour l'ordonnance d'une commande
  async updateOrderPrescription(orderId, prescriptionUrl) {
    return this.request(`/orders/${orderId}/prescription`, {
      method: 'PATCH',
      body: { prescriptionUrl },
    });
  }

  // Payment methods
  async processPayment(paymentData) {
    return this.request('/payments/process', {
      method: 'POST',
      body: paymentData,
    });
  }

  async validatePayment(orderId) {
    return this.request(`/payments/${orderId}/validate`, {
      method: 'POST',
    });
  }

  async getPaymentMethods() {
    return this.request('/payments/methods');
  }

  // Delivery methods
  async getAvailableDeliveries() {
    return this.request('/deliveries/available');
  }

  async acceptDelivery(orderId) {
    return this.request(`/deliveries/${orderId}/accept`, {
      method: 'POST',
    });
  }

  async completeDelivery(orderId, deliveryData = {}) {
    return this.request(`/deliveries/${orderId}/complete`, {
      method: 'POST',
      body: deliveryData,
    });
  }

  async updateDriverLocation(latitude, longitude) {
    return this.request('/deliveries/location', {
      method: 'POST',
      body: { latitude, longitude },
    });
  }

  async getDriverStats() {
    return this.request('/deliveries/stats');
  }

  // Medicine methods
  async getMedicines(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/medicines${queryString ? `?${queryString}` : ''}`);
  }

  // Nouvelle méthode pour récupérer les médicaments d'un pharmacien
  async getPharmacistMedicines(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/medicines/pharmacist/my-medicines${queryString ? `?${queryString}` : ''}`);
  }

  async getMedicineById(medicineId) {
    return this.request(`/medicines/${medicineId}`);
  }

  async createMedicine(medicineData) {
    return this.request('/medicines', {
      method: 'POST',
      body: medicineData,
    });
  }

  async updateMedicine(medicineId, medicineData) {
    return this.request(`/medicines/${medicineId}`, {
      method: 'PUT',
      body: medicineData,
    });
  }

  async deleteMedicine(medicineId) {
    return this.request(`/medicines/${medicineId}`, {
      method: 'DELETE',
    });
  }

  async updateMedicineStock(medicineId, quantity, operation = 'set') {
    return this.request(`/medicines/${medicineId}/stock`, {
      method: 'PATCH',
      body: { quantity, operation },
    });
  }

  async getMedicineCategories() {
    return this.request('/medicines/categories');
  }

  // Pharmacy methods
  async getPharmacies(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/pharmacies${queryString ? `?${queryString}` : ''}`);
  }

  async getPharmacyById(pharmacyId) {
    return this.request(`/pharmacies/${pharmacyId}`);
  }

  async createPharmacy(pharmacyData) {
    return this.request('/pharmacies', {
      method: 'POST',
      body: pharmacyData,
    });
  }

  async updatePharmacy(pharmacyId, pharmacyData) {
    return this.request(`/pharmacies/${pharmacyId}`, {
      method: 'PUT',
      body: pharmacyData,
    });
  }

  // Chat methods
  async getMessages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/chat/messages${queryString ? `?${queryString}` : ''}`);
  }

  async sendMessage(messageData) {
    return this.request('/chat/messages', {
      method: 'POST',
      body: messageData,
    });
  }

  async markMessagesAsRead(senderId, orderId = null) {
    return this.request('/chat/messages/read', {
      method: 'PATCH',
      body: { senderId, orderId },
    });
  }

  async getChatContacts() {
    return this.request('/chat/contacts');
  }

  async getAvailableContacts() {
    return this.request('/chat/available-contacts');
  }

  // Notification methods
  async getNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  logout() {
    this.setToken(null);
  }
}

export default new ApiService();