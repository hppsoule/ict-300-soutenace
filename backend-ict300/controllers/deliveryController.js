import pool from '../config/database.js';
import { sendNotification } from '../utils/notifications.js';

export const acceptDelivery = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { orderId } = req.params;
    const driverId = req.user.id;

    console.log('🔄 Acceptation de livraison:', {
      orderId,
      driverId
    });

    // Vérifier que la commande existe et est prête pour livraison
    const orderResult = await client.query(`
      SELECT o.*, 
             p.name as pharmacy_name, p.street as pharmacy_street, p.city as pharmacy_city,
             u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
             u_patient.id as patient_id,
             p.owner_id as pharmacy_owner_id
      FROM orders o
      JOIN pharmacies p ON o.pharmacy_id = p.id
      LEFT JOIN users u_patient ON o.patient_id = u_patient.id
      WHERE o.id = $1 AND o.status IN ('ready', 'preparing')
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      throw new Error('Commande non disponible pour livraison');
    }

    const order = orderResult.rows[0];

    // Vérifier que la commande n'a pas déjà un livreur assigné
    if (order.driver_id && order.driver_id !== driverId) {
      throw new Error('Cette commande a déjà un livreur assigné');
    }

    // Vérifier que le livreur n'a pas déjà une livraison en cours
    const activeDeliveryResult = await client.query(`
      SELECT id FROM orders 
      WHERE driver_id = $1 AND status = 'in_transit'
    `, [driverId]);

    if (activeDeliveryResult.rows.length > 0) {
      throw new Error('Vous avez déjà une livraison en cours. Terminez-la avant d\'en accepter une nouvelle.');
    }

    // Assigner le livreur et mettre à jour le statut
    await client.query(`
      UPDATE orders 
      SET driver_id = $1, 
          status = $2, 
          updated_at = CURRENT_TIMESTAMP,
          estimated_delivery = CURRENT_TIMESTAMP + INTERVAL '30 minutes'
      WHERE id = $3
    `, [driverId, 'in_transit', orderId]);

    // Ajouter une mise à jour de suivi
    await client.query(`
      INSERT INTO tracking_updates (order_id, status, message)
      VALUES ($1, $2, $3)
    `, [orderId, 'in_transit', 'Livreur assigné - Livraison en cours']);

    // Mettre à jour la disponibilité du livreur
    await client.query(`
      INSERT INTO driver_locations (driver_id, latitude, longitude, is_available, updated_at)
      VALUES ($1, 48.8566, 2.3522, false, CURRENT_TIMESTAMP)
      ON CONFLICT (driver_id) 
      DO UPDATE SET is_available = false, updated_at = CURRENT_TIMESTAMP
    `, [driverId]);

    await client.query('COMMIT');

    // Récupérer les informations du livreur
    const driverResult = await pool.query(
      'SELECT first_name, last_name, phone FROM users WHERE id = $1',
      [driverId]
    );
    const driver = driverResult.rows[0];

    // 🔔 NOTIFICATIONS AUTOMATIQUES

    // 1. Notifier le patient (vérifier qu'il existe)
    if (order.patient_id) {
      await sendNotification(
        order.patient_id,
        {
          title: 'Livreur en route 🚚',
          message: `${driver.first_name} ${driver.last_name} a pris en charge votre commande #${orderId.slice(-6)}. Livraison estimée dans 30 minutes.`,
          type: 'info',
          orderId: orderId
        },
        req.io
      );
    }

    // 2. Notifier la pharmacie (vérifier qu'elle existe)
    if (order.pharmacy_owner_id) {
      await sendNotification(
        order.pharmacy_owner_id,
        {
          title: 'Livreur assigné ✅',
          message: `${driver.first_name} ${driver.last_name} a pris en charge la commande #${orderId.slice(-6)}`,
          type: 'success',
          orderId: orderId
        },
        req.io
      );
    }

    // 3. Notifier les admins
    const adminsResult = await pool.query(
      'SELECT id FROM users WHERE role = $1 AND is_active = true',
      ['admin']
    );

    for (const admin of adminsResult.rows) {
      await sendNotification(
        admin.id,
        {
          title: 'Livraison en cours 🚛',
          message: `Commande #${orderId.slice(-6)} prise en charge par ${driver.first_name} ${driver.last_name}`,
          type: 'info',
          orderId: orderId
        },
        req.io
      );
    }

    console.log('✅ Livraison acceptée et notifications envoyées');

    res.status(200).json({
      message: 'Livraison acceptée avec succès',
      orderId: orderId,
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur acceptation livraison:', error);
    res.status(400).json({ error: error.message || 'Erreur d\'acceptation' });
  } finally {
    client.release();
  }
};

export const updateDeliveryLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const driverId = req.user.id;

    // Mettre à jour la position du livreur
    await pool.query(`
      INSERT INTO driver_locations (driver_id, latitude, longitude, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (driver_id) 
      DO UPDATE SET latitude = $2, longitude = $3, updated_at = CURRENT_TIMESTAMP
    `, [driverId, latitude, longitude]);

    // Récupérer les commandes en cours pour ce livreur
    const activeOrdersResult = await pool.query(`
      SELECT patient_id, id as order_id
      FROM orders 
      WHERE driver_id = $1 AND status = 'in_transit'
    `, [driverId]);

    // Broadcast location to relevant users (patients with active orders)
    activeOrdersResult.rows.forEach(order => {
      if (order.patient_id) {
        req.io?.to(`user_${order.patient_id}`).emit('driver_location_update', {
          orderId: order.order_id,
          driverLocation: { lat: latitude, lng: longitude }
        });
      }
    });

    res.status(200).json({
      message: 'Position mise à jour',
      location: { latitude, longitude }
    });

  } catch (error) {
    console.error('Erreur mise à jour position:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const completeDelivery = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { orderId } = req.params;
    const { deliveryNotes, customerSignature } = req.body;
    const driverId = req.user.id;

    console.log('🔄 Finalisation de livraison:', {
      orderId,
      driverId
    });

    // Vérifier que la commande appartient au livreur
    const orderResult = await client.query(`
      SELECT o.*, 
             u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
             u_patient.id as patient_id,
             p.name as pharmacy_name, p.owner_id as pharmacy_owner_id
      FROM orders o
      JOIN pharmacies p ON o.pharmacy_id = p.id
      LEFT JOIN users u_patient ON o.patient_id = u_patient.id
      WHERE o.id = $1 AND o.driver_id = $2 AND o.status = 'in_transit'
    `, [orderId, driverId]);

    if (orderResult.rows.length === 0) {
      throw new Error('Commande non trouvée ou non autorisée');
    }

    const order = orderResult.rows[0];

    // Marquer la commande comme livrée
    await client.query(`
      UPDATE orders 
      SET status = $1, 
          delivered_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, ['delivered', orderId]);

    // Ajouter une mise à jour de suivi finale
    await client.query(`
      INSERT INTO tracking_updates (order_id, status, message)
      VALUES ($1, $2, $3)
    `, [orderId, 'delivered', deliveryNotes || 'Commande livrée avec succès']);

    // Remettre le livreur disponible
    await client.query(`
      UPDATE driver_locations 
      SET is_available = true, updated_at = CURRENT_TIMESTAMP
      WHERE driver_id = $1
    `, [driverId]);

    await client.query('COMMIT');

    // Récupérer les informations du livreur
    const driverResult = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [driverId]
    );
    const driver = driverResult.rows[0];

    // 🔔 NOTIFICATIONS AUTOMATIQUES

    // 1. Notifier le patient
    if (order.patient_id) {
      await sendNotification(
        order.patient_id,
        {
          title: 'Commande livrée ✅',
          message: `Votre commande #${orderId.slice(-6)} a été livrée par ${driver.first_name} ${driver.last_name}. Merci pour votre confiance !`,
          type: 'success',
          orderId: orderId
        },
        req.io
      );
    }

    // 2. Notifier la pharmacie
    if (order.pharmacy_owner_id) {
      await sendNotification(
        order.pharmacy_owner_id,
        {
          title: 'Livraison terminée 📦',
          message: `Commande #${orderId.slice(-6)} livrée avec succès à ${order.patient_first_name} ${order.patient_last_name}`,
          type: 'success',
          orderId: orderId
        },
        req.io
      );
    }

    // 3. Notifier les admins
    const adminsResult = await pool.query(
      'SELECT id FROM users WHERE role = $1 AND is_active = true',
      ['admin']
    );

    for (const admin of adminsResult.rows) {
      await sendNotification(
        admin.id,
        {
          title: 'Livraison complétée 🎉',
          message: `Commande #${orderId.slice(-6)} livrée par ${driver.first_name} ${driver.last_name} - €${order.total}`,
          type: 'success',
          orderId: orderId
        },
        req.io
      );
    }

    console.log('✅ Livraison terminée et notifications envoyées');

    res.status(200).json({
      message: 'Livraison terminée avec succès',
      orderId: orderId,
      deliveredAt: new Date().toISOString()
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur finalisation livraison:', error);
    res.status(400).json({ error: error.message || 'Erreur de finalisation' });
  } finally {
    client.release();
  }
};

export const getAvailableDeliveries = async (req, res) => {
  try {
    const driverId = req.user.id;
    const userRole = req.user.role;

    // Vérifier si le livreur a déjà une livraison en cours
    if (userRole === 'driver') {
      const activeDeliveryResult = await pool.query(`
        SELECT id FROM orders 
        WHERE driver_id = $1 AND status = 'in_transit'
      `, [driverId]);

      // Si le livreur a déjà une livraison en cours, ne pas proposer d'autres livraisons
      if (activeDeliveryResult.rows.length > 0) {
        return res.json([]);
      }
    }

    // Récupérer les livraisons disponibles (commandes prêtes sans livreur)
    const deliveriesResult = await pool.query(`
      SELECT o.id, o.total, o.delivery_street, o.delivery_city, o.delivery_postal_code,
             o.delivery_latitude, o.delivery_longitude, o.created_at,
             p.name as pharmacy_name, p.street as pharmacy_street, p.city as pharmacy_city,
             p.latitude as pharmacy_latitude, p.longitude as pharmacy_longitude,
             u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN pharmacies p ON o.pharmacy_id = p.id
      LEFT JOIN users u_patient ON o.patient_id = u_patient.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('ready', 'preparing') AND o.driver_id IS NULL
      GROUP BY o.id, p.name, p.street, p.city, p.latitude, p.longitude, 
               u_patient.first_name, u_patient.last_name
      ORDER BY o.created_at ASC
    `);

    // Récupérer la position du livreur si c'est un livreur qui fait la requête
    let driverLocation = null;
    if (userRole === 'driver') {
      const driverLocationResult = await pool.query(
        'SELECT latitude, longitude FROM driver_locations WHERE driver_id = $1',
        [driverId]
      );
      
      if (driverLocationResult.rows.length > 0) {
        driverLocation = driverLocationResult.rows[0];
      }
    }

    const deliveries = deliveriesResult.rows.map(delivery => {
      // Calculer la distance approximative (formule haversine simplifiée)
      let distance = null;
      if (driverLocation && delivery.delivery_latitude && delivery.delivery_longitude) {
        const R = 6371; // Rayon de la Terre en km
        const dLat = (delivery.delivery_latitude - driverLocation.latitude) * Math.PI / 180;
        const dLon = (delivery.delivery_longitude - driverLocation.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(driverLocation.latitude * Math.PI / 180) * Math.cos(delivery.delivery_latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c; // Distance en km
      }

      return {
        id: delivery.id,
        total: parseFloat(delivery.total),
        deliveryFee: 5.00, // Frais de livraison fixe
        distance: distance ? `${distance.toFixed(1)} km` : 'N/A',
        estimatedTime: distance ? `${Math.ceil(distance * 3)} min` : 'N/A', // 3 min par km
        pharmacy: {
          name: delivery.pharmacy_name,
          address: `${delivery.pharmacy_street}, ${delivery.pharmacy_city}`
        },
        delivery: {
          address: `${delivery.delivery_street}, ${delivery.delivery_city}`,
          customer: `${delivery.patient_first_name} ${delivery.patient_last_name}`
        },
        itemCount: parseInt(delivery.item_count),
        createdAt: delivery.created_at
      };
    });

    res.json(deliveries);

  } catch (error) {
    console.error('Erreur récupération livraisons:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Nouvelle fonction pour récupérer les livreurs disponibles
export const getAvailableDrivers = async (req, res) => {
  try {
    // Récupérer tous les livreurs actifs
    const driversResult = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.phone,
             dl.latitude, dl.longitude, dl.is_available
      FROM users u
      LEFT JOIN driver_locations dl ON u.id = dl.driver_id
      WHERE u.role = 'driver' AND u.is_active = true
      ORDER BY dl.is_available DESC, u.first_name ASC
    `);

    // Récupérer la position de la pharmacie pour calculer les distances
    const pharmacyResult = await pool.query(`
      SELECT p.latitude, p.longitude
      FROM pharmacies p
      WHERE p.owner_id = $1
    `, [req.user.id]);

    const pharmacyLocation = pharmacyResult.rows[0];

    const drivers = driversResult.rows.map(driver => {
      // Calculer la distance approximative si les coordonnées sont disponibles
      let distance = null;
      if (pharmacyLocation && driver.latitude && driver.longitude) {
        const R = 6371; // Rayon de la Terre en km
        const dLat = (driver.latitude - pharmacyLocation.latitude) * Math.PI / 180;
        const dLon = (driver.longitude - pharmacyLocation.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(pharmacyLocation.latitude * Math.PI / 180) * Math.cos(driver.latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c; // Distance en km
      }

      return {
        id: driver.id,
        name: `${driver.first_name} ${driver.last_name}`,
        phone: driver.phone,
        distance: distance ? `${distance.toFixed(1)} km` : null,
        isAvailable: driver.is_available
      };
    });

    res.json(drivers);
  } catch (error) {
    console.error('Erreur récupération livreurs disponibles:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const getDriverStats = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Statistiques du jour
    const todayStats = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as deliveries_today,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN 5.00 ELSE 0 END), 0) as earnings_today,
        AVG(CASE WHEN delivered_at IS NOT NULL THEN EXTRACT(EPOCH FROM (delivered_at - created_at))/60 END) as avg_delivery_time
      FROM orders 
      WHERE driver_id = $1 AND DATE(created_at) = DATE(CURRENT_DATE)
    `, [driverId]);

    // Statistiques globales
    const totalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_deliveries,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN 5.00 ELSE 0 END), 0) as total_earnings,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_deliveries
      FROM orders 
      WHERE driver_id = $1
    `, [driverId]);

    // Commande en cours
    const activeDelivery = await pool.query(`
      SELECT o.id, o.total, o.delivery_street, o.delivery_city,
             u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
             u_patient.phone as patient_phone,
             p.name as pharmacy_name, p.owner_id as pharmacy_owner_id
      FROM orders o
      JOIN pharmacies p ON o.pharmacy_id = p.id
      LEFT JOIN users u_patient ON o.patient_id = u_patient.id
      WHERE o.driver_id = $1 AND o.status = 'in_transit'
      LIMIT 1
    `, [driverId]);

    const stats = {
      today: {
        deliveries: parseInt(todayStats.rows[0].deliveries_today) || 0,
        earnings: parseFloat(todayStats.rows[0].earnings_today) || 0,
        avgTime: todayStats.rows[0].avg_delivery_time ? 
                 Math.round(todayStats.rows[0].avg_delivery_time) : 0
      },
      total: {
        deliveries: parseInt(totalStats.rows[0].total_deliveries) || 0,
        earnings: parseFloat(totalStats.rows[0].total_earnings) || 0,
        completionRate: totalStats.rows[0].total_deliveries > 0 ? 
                       Math.round((totalStats.rows[0].completed_deliveries / totalStats.rows[0].total_deliveries) * 100) : 0
      },
      activeDelivery: activeDelivery.rows[0] || null
    };

    res.json(stats);

  } catch (error) {
    console.error('Erreur récupération statistiques livreur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Nouvelle fonction pour récupérer l'historique des livraisons
export const getDeliveryHistory = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { status, period } = req.query;
    
    let query = `
      SELECT o.id, o.total, o.status, o.created_at, o.delivered_at, o.updated_at,
             o.delivery_street, o.delivery_city, o.delivery_postal_code,
             p.name as pharmacy_name,
             u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN pharmacies p ON o.pharmacy_id = p.id
      LEFT JOIN users u_patient ON o.patient_id = u_patient.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.driver_id = $1
    `;
    
    const params = [driverId];
    let paramIndex = 1;
    
    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      paramIndex++;
      query += ` AND o.status = $${paramIndex}`;
      params.push(status);
    }
    
    // Filtrer par période si spécifiée
    if (period) {
      paramIndex++;
      if (period === 'today') {
        query += ` AND DATE(o.created_at) = CURRENT_DATE`;
      } else if (period === 'week') {
        query += ` AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      } else if (period === 'month') {
        query += ` AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
      }
    }
    
    query += ` GROUP BY o.id, p.name, u_patient.first_name, u_patient.last_name
               ORDER BY o.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    const deliveries = result.rows.map(delivery => ({
      id: delivery.id,
      status: delivery.status,
      total: parseFloat(delivery.total),
      deliveryFee: 5.00, // Frais de livraison fixe
      pharmacy: {
        name: delivery.pharmacy_name
      },
      delivery: {
        address: `${delivery.delivery_street}, ${delivery.delivery_city}`,
        customer: `${delivery.patient_first_name} ${delivery.patient_last_name}`
      },
      itemCount: parseInt(delivery.item_count),
      createdAt: delivery.created_at,
      deliveredAt: delivery.delivered_at,
      updatedAt: delivery.updated_at,
      earnings: 5.00 // Gain fixe par livraison
    }));
    
    res.json(deliveries);
  } catch (error) {
    console.error('Erreur récupération historique des livraisons:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};