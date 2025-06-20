import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import medicineRoutes from './routes/medicines.js';
import pharmacyRoutes from './routes/pharmacies.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/upload.js';
import paymentRoutes from './routes/payments.js';
import deliveryRoutes from './routes/deliveries.js';

// Import database
import pool, { testConnection } from './config/database.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Rate limiting - MODIFIÉ: augmentation de la limite et du temps
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // augmenté de 100 à 500 requêtes par fenêtre
  message: { error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Assurez-vous que cette valeur correspond exactement à l'origine de votre frontend
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    message: 'Serveur PharmaDelivery opérationnel'
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as user_count FROM users');
    res.json({
      status: 'OK',
      database: 'Connected',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  // Erreur de validation Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.details.map(detail => detail.message)
    });
  }
  
  // Erreur de base de données
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      error: 'Erreur de base de données',
      message: 'Données invalides ou conflit'
    });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message || 'Erreur interne du serveur'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Utilisateur connecté:', socket.id);

  // Join user to their personal room
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Utilisateur ${userId} a rejoint sa room`);
  });

  // Handle driver location updates
  socket.on('update_driver_location', async (data) => {
    try {
      const { driverId, latitude, longitude } = data;
      
      // Update driver location in database
      await pool.query(`
        INSERT INTO driver_locations (driver_id, latitude, longitude, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (driver_id) 
        DO UPDATE SET latitude = $2, longitude = $3, updated_at = CURRENT_TIMESTAMP
      `, [driverId, latitude, longitude]);

      // Broadcast location to relevant users (patients with active orders)
      const activeOrders = await pool.query(`
        SELECT patient_id, id as order_id
        FROM orders 
        WHERE driver_id = $1 AND status = 'in_transit'
      `, [driverId]);

      activeOrders.rows.forEach(order => {
        io.to(`user_${order.patient_id}`).emit('driver_location_update', {
          orderId: order.order_id,
          driverLocation: { lat: latitude, lng: longitude }
        });
      });

    } catch (error) {
      console.error('Erreur de mise à jour de localisation du livreur:', error);
    }
  });

  // Handle order status updates
  socket.on('order_status_update', (data) => {
    const { orderId, status, patientId, pharmacistId, driverId } = data;
    
    // Notify relevant users
    if (patientId) {
      io.to(`user_${patientId}`).emit('order_status_changed', { orderId, status });
    }
    if (pharmacistId) {
      io.to(`user_${pharmacistId}`).emit('order_status_changed', { orderId, status });
    }
    if (driverId) {
      io.to(`user_${driverId}`).emit('order_status_changed', { orderId, status });
    }
  });

  // Handle delivery acceptance notifications
  socket.on('delivery_accepted', (data) => {
    const { orderId, driverId, patientId, pharmacistId } = data;
    
    // Notify patient and pharmacist
    if (patientId) {
      io.to(`user_${patientId}`).emit('delivery_accepted', { orderId, driverId });
    }
    if (pharmacistId) {
      io.to(`user_${pharmacistId}`).emit('delivery_accepted', { orderId, driverId });
    }
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
  });
});

// Start server with database connection check
const startServer = async () => {
  console.log('🚀 Démarrage du serveur PharmaDelivery...');
  
  // Test de connexion à la base de données
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ Impossible de se connecter à la base de données');
    console.error('🔧 Vérifiez votre configuration dans le fichier .env');
    console.error('📝 Exemple de configuration:');
    console.error('   DB_HOST=localhost');
    console.error('   DB_PORT=5432');
    console.error('   DB_NAME=pharma_delivery');
    console.error('   DB_USER=postgres');
    console.error('   DB_PASSWORD=votre_mot_de_passe');
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Serveur PharmaDelivery démarré sur le port ${PORT}`);
    console.log(`📱 URL Frontend: ${process.env.FRONTEND_URL}`);
    console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
    console.log(`🔗 API disponible sur: http://localhost:${PORT}/api`);
    console.log(`☁️ Cloudinary configuré: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`💳 Système de paiement: Activé`);
    console.log(`🚚 Système de livraison: Activé`);
    console.log('✅ Serveur prêt à recevoir des connexions');
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM reçu, arrêt gracieux du serveur');
  server.close(() => {
    console.log('Serveur fermé');
    pool.end(() => {
      console.log('Connexion à la base de données fermée');
      process.exit(0);
    });
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT reçu, arrêt gracieux du serveur');
  server.close(() => {
    console.log('Serveur fermé');
    pool.end(() => {
      console.log('Connexion à la base de données fermée');
      process.exit(0);
    });
  });
});

// Démarrer le serveur
startServer().catch(error => {
  console.error('❌ Erreur lors du démarrage du serveur:', error);
  process.exit(1);
});