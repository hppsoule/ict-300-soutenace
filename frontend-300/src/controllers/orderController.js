import pool from '../config/database.js';
import { sendNotification } from '../utils/notifications.js';

export const createOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { pharmacyId, items, deliveryAddress, prescriptionUrl } = req.body;
    const patientId = req.user.id;

    // Calculate total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const medicineResult = await client.query(
        'SELECT id, name, price, quantity, requires_prescription FROM medicines WHERE id = $1 AND pharmacy_id = $2',
        [item.medicineId, pharmacyId]
      );

      if (medicineResult.rows.length === 0) {
        throw new Error(`Medicine not found: ${item.medicineId}`);
      }

      const medicine = medicineResult.rows[0];
      
      if (medicine.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${medicine.name}`);
      }

      const itemTotal = medicine.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        medicineId: medicine.id,
        medicine: medicine,
        quantity: item.quantity,
        price: medicine.price
      });
    }

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (patient_id, pharmacy_id, total, delivery_street, delivery_city, delivery_postal_code, delivery_country, delivery_latitude, delivery_longitude, prescription_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at
    `, [
      patientId,
      pharmacyId,
      total,
      deliveryAddress.street,
      deliveryAddress.city,
      deliveryAddress.postalCode,
      deliveryAddress.country,
      deliveryAddress.latitude || null,
      deliveryAddress.longitude || null,
      prescriptionUrl || null
    ]);

    const orderId = orderResult.rows[0].id;

    // Create order items
    for (const item of orderItems) {
      await client.query(`
        INSERT INTO order_items (order_id, medicine_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `, [orderId, item.medicineId, item.quantity, item.price]);
    }

    // Create tracking update
    await client.query(`
      INSERT INTO tracking_updates (order_id, status, message)
      VALUES ($1, $2, $3)
    `, [orderId, 'pending', 'Commande reçue et en attente de validation']);

    await client.query('COMMIT');

    // Send notification to pharmacy owner
    const pharmacyResult = await client.query(
      'SELECT owner_id, name FROM pharmacies WHERE id = $1',
      [pharmacyId]
    );

    if (pharmacyResult.rows.length > 0) {
      const pharmacy = pharmacyResult.rows[0];
      await sendNotification(
        pharmacy.owner_id,
        {
          title: 'Nouvelle commande reçue',
          message: `Nouvelle commande #${orderId.slice(-6)} de ${orderItems.length} article(s) - €${total.toFixed(2)}`,
          type: 'info',
          orderId: orderId
        },
        req.io
      );
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderId: orderId,
      total: total
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let query = `
      SELECT o.*, 
             p.name as pharmacy_name, p.owner_id as pharmacy_owner_id,
             u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
             u_driver.first_name as driver_first_name, u_driver.last_name as driver_last_name,
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'medicineId', oi.medicine_id,
                 'medicineName', m.name,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'requiresPrescription', m.requires_prescription
               )
             ) as items
      FROM orders o
      LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
      LEFT JOIN users u_patient ON o.patient_id = u_patient.id
      LEFT JOIN users u_driver ON o.driver_id = u_driver.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN medicines m ON oi.medicine_id = m.id
    `;

    let params = [];
    
    if (userRole === 'patient') {
      query += ' WHERE o.patient_id = $1';
      params = [userId];
    } else if (userRole === 'pharmacist') {
      query += ' WHERE p.owner_id = $1';
      params = [userId];
    } else if (userRole === 'driver') {
      query += ' WHERE o.driver_id = $1 OR (o.driver_id IS NULL AND o.status = $2)';
      params = [userId, 'ready'];
    }

    query += ' GROUP BY o.id, p.name, p.owner_id, u_patient.first_name, u_patient.last_name, u_driver.first_name, u_driver.last_name ORDER BY o.created_at DESC';

    const result = await pool.query(query, params);

    const orders = result.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      pharmacyId: row.pharmacy_id,
      pharmacyName: row.pharmacy_name,
      pharmacyOwnerId: row.pharmacy_owner_id,
      driverId: row.driver_id,
      patientName: `${row.patient_first_name} ${row.patient_last_name}`,
      driverName: row.driver_first_name ? `${row.driver_first_name} ${row.driver_last_name}` : null,
      total: parseFloat(row.total),
      status: row.status,
      prescriptionUrl: row.prescription_url,
      rejectionReason: row.rejection_reason,
      deliveryAddress: {
        street: row.delivery_street,
        city: row.delivery_city,
        postalCode: row.delivery_postal_code,
        country: row.delivery_country,
        coordinates: row.delivery_latitude && row.delivery_longitude ? {
          lat: parseFloat(row.delivery_latitude),
          lng: parseFloat(row.delivery_longitude)
        } : null
      },
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      deliveryFee: parseFloat(row.delivery_fee || 0),
      estimatedDelivery: row.estimated_delivery,
      deliveredAt: row.delivered_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: row.items || []
    }));

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await pool.query(`
      SELECT o.*, 
             p.name as pharmacy_name, p.phone as pharmacy_phone, p.owner_id as pharmacy_owner_id,
             u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name, u_patient.phone as patient_phone,
             u_driver.first_name as driver_first_name, u_driver.last_name as driver_last_name, u_driver.phone as driver_phone,
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'medicineId', oi.medicine_id,
                 'medicineName', m.name,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'requiresPrescription', m.requires_prescription
               )
             ) as items
      FROM orders o
      LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
      LEFT JOIN users u_patient ON o.patient_id = u_patient.id
      LEFT JOIN users u_driver ON o.driver_id = u_driver.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN medicines m ON oi.medicine_id = m.id
      WHERE o.id = $1
      GROUP BY o.id, p.name, p.phone, p.owner_id, u_patient.first_name, u_patient.last_name, u_patient.phone, u_driver.first_name, u_driver.last_name, u_driver.phone
    `, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Check permissions
    const hasAccess = 
      userRole === 'admin' ||
      (userRole === 'patient' && order.patient_id === userId) ||
      (userRole === 'driver' && order.driver_id === userId) ||
      (userRole === 'pharmacist' && await checkPharmacyOwnership(userId, order.pharmacy_id));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get tracking updates
    const trackingResult = await pool.query(`
      SELECT status, message, latitude, longitude, created_at
      FROM tracking_updates
      WHERE order_id = $1
      ORDER BY created_at DESC
    `, [orderId]);

    const orderData = {
      id: order.id,
      patientId: order.patient_id,
      pharmacyId: order.pharmacy_id,
      pharmacyName: order.pharmacy_name,
      pharmacyPhone: order.pharmacy_phone,
      pharmacyOwnerId: order.pharmacy_owner_id,
      driverId: order.driver_id,
      patientName: `${order.patient_first_name} ${order.patient_last_name}`,
      patientPhone: order.patient_phone,
      driverName: order.driver_first_name ? `${order.driver_first_name} ${order.driver_last_name}` : null,
      driverPhone: order.driver_phone,
      total: parseFloat(order.total),
      status: order.status,
      prescriptionUrl: order.prescription_url,
      rejectionReason: order.rejection_reason,
      deliveryAddress: {
        street: order.delivery_street,
        city: order.delivery_city,
        postalCode: order.delivery_postal_code,
        country: order.delivery_country,
        coordinates: order.delivery_latitude && order.delivery_longitude ? {
          lat: parseFloat(order.delivery_latitude),
          lng: parseFloat(order.delivery_longitude)
        } : null
      },
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      deliveryFee: parseFloat(order.delivery_fee || 0),
      estimatedDelivery: order.estimated_delivery,
      deliveredAt: order.delivered_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: order.items || [],
      trackingInfo: {
        updates: trackingResult.rows.map(update => ({
          timestamp: update.created_at,
          status: update.status,
          message: update.message,
          location: update.latitude && update.longitude ? {
            lat: parseFloat(update.latitude),
            lng: parseFloat(update.longitude)
          } : null
        }))
      }
    };

    res.json(orderData);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { orderId } = req.params;
    const { status, rejectionReason, driverId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('🔄 Mise à jour du statut de commande:', {
      orderId,
      status,
      rejectionReason,
      driverId,
      userId,
      userRole
    });

    // Validation stricte des paramètres
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'ID de commande invalide' });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // Vérifier que l'orderId est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return res.status(400).json({ error: 'Format d\'ID de commande invalide' });
    }

    // Statuts valides
    const validStatuses = ['pending', 'validated', 'rejected', 'paid', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut non autorisé' });
    }

    // Validation spécifique pour le rejet
    if (status === 'rejected' && (!rejectionReason || rejectionReason.trim().length < 3)) {
      return res.status(400).json({ error: 'La raison du rejet est requise et doit contenir au moins 3 caractères' });
    }

    // Get current order
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const order = orderResult.rows[0];

    // Check permissions and validate status transitions
    let canUpdate = false;
    let trackingMessage = '';

    switch (userRole) {
      case 'pharmacist':
        if (['validated', 'rejected', 'preparing', 'ready'].includes(status)) {
          const pharmacyCheck = await client.query(
            'SELECT id FROM pharmacies WHERE id = $1 AND owner_id = $2',
            [order.pharmacy_id, userId]
          );
          canUpdate = pharmacyCheck.rows.length > 0;
        }
        break;
      
      case 'driver':
        if (['in_transit', 'delivered'].includes(status)) {
          canUpdate = order.driver_id === userId;
        }
        break;
      
      case 'admin':
        canUpdate = true;
        break;
    }

    if (!canUpdate) {
      return res.status(403).json({ error: 'Non autorisé à modifier le statut de cette commande' });
    }

    // Set tracking message based on status
    const statusMessages = {
      validated: 'Commande validée par la pharmacie',
      rejected: rejectionReason || 'Commande rejetée par la pharmacie',
      preparing: 'Commande en cours de préparation',
      ready: 'Commande prête pour livraison',
      in_transit: 'Commande en cours de livraison',
      delivered: 'Commande livrée avec succès',
      cancelled: 'Commande annulée'
    };

    trackingMessage = statusMessages[status] || `Statut mis à jour: ${status}`;

    // Mise à jour du livreur si spécifié (pour le statut 'ready')
    if (status === 'ready' && driverId) {
      await client.query(`
        UPDATE orders 
        SET driver_id = $1
        WHERE id = $2
      `, [driverId, orderId]);
      
      // Ajouter un message de suivi pour l'assignation du livreur
      await client.query(`
        INSERT INTO tracking_updates (order_id, status, message)
        VALUES ($1, $2, $3)
      `, [orderId, 'ready', 'Livreur assigné à la commande']);
      
      // Récupérer les informations du livreur
      const driverResult = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [driverId]
      );
      
      if (driverResult.rows.length > 0) {
        const driver = driverResult.rows[0];
        trackingMessage += ` - Livreur assigné: ${driver.first_name} ${driver.last_name}`;
      }
    }

    // Update order - Requêtes séparées pour éviter les conflits de types
    if (status === 'rejected' && rejectionReason) {
      // Cas spécial pour le rejet avec raison
      await client.query(`
        UPDATE orders 
        SET status = $1, 
            rejection_reason = $2, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [status, rejectionReason.trim(), orderId]);
    } else if (status === 'delivered') {
      // Cas spécial pour la livraison
      await client.query(`
        UPDATE orders 
        SET status = $1, 
            updated_at = CURRENT_TIMESTAMP,
            delivered_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [status, orderId]);
    } else {
      // Cas général
      await client.query(`
        UPDATE orders 
        SET status = $1, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [status, orderId]);
    }

    // Add tracking update
    await client.query(`
      INSERT INTO tracking_updates (order_id, status, message)
      VALUES ($1, $2, $3)
    `, [orderId, status, trackingMessage]);

    // If order is ready, find and assign nearest driver
    if (status === 'ready' && !driverId) {
      // Récupérer les informations de la commande
      const orderDetailsResult = await client.query(`
        SELECT o.*, p.owner_id as pharmacy_owner_id
        FROM orders o
        JOIN pharmacies p ON o.pharmacy_id = p.id
        WHERE o.id = $1
      `, [orderId]);
      
      const orderDetails = orderDetailsResult.rows[0];
      
      // Notifier tous les livreurs disponibles au lieu d'assigner automatiquement
      const availableDriversResult = await client.query(`
        SELECT u.id
        FROM users u
        JOIN driver_locations dl ON u.id = dl.driver_id
        WHERE u.role = 'driver' AND u.is_active = true AND dl.is_available = true
      `);
      
      // Envoyer une notification à chaque livreur disponible
      for (const driver of availableDriversResult.rows) {
        await sendNotification(
          driver.id,
          {
            title: 'Nouvelle livraison disponible',
            message: `Livraison disponible vers ${orderDetails.delivery_city} - €${orderDetails.total}`,
            type: 'info',
            orderId: orderId
          },
          req.io
        );
      }
    }

    await client.query('COMMIT');

    console.log('✅ Statut de commande mis à jour avec succès');

    // Send notifications based on status change
    const notifications = [];

    // Récupérer les informations complètes pour les notifications
    const fullOrderResult = await pool.query(`
      SELECT o.*, 
             u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
             u_driver.first_name as driver_first_name, u_driver.last_name as driver_last_name,
             p.name as pharmacy_name, p.owner_id as pharmacy_owner_id
      FROM orders o
      LEFT JOIN users u_patient ON o.patient_id = u_patient.id
      LEFT JOIN users u_driver ON o.driver_id = u_driver.id
      LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
      WHERE o.id = $1
    `, [orderId]);

    if (fullOrderResult.rows.length > 0) {
      const fullOrder = fullOrderResult.rows[0];
      
      if (status === 'validated') {
        notifications.push({
          userId: fullOrder.patient_id,
          notification: {
            title: 'Commande validée ✅',
            message: `Votre commande #${orderId.slice(-6)} a été validée et est en cours de préparation`,
            type: 'success',
            orderId: orderId
          }
        });
      } else if (status === 'rejected') {
        notifications.push({
          userId: fullOrder.patient_id,
          notification: {
            title: 'Commande rejetée ❌',
            message: rejectionReason || `Votre commande #${orderId.slice(-6)} a été rejetée`,
            type: 'error',
            orderId: orderId
          }
        });
      } else if (status === 'preparing') {
        notifications.push({
          userId: fullOrder.patient_id,
          notification: {
            title: 'Préparation en cours 🔄',
            message: `Votre commande #${orderId.slice(-6)} est en cours de préparation`,
            type: 'info',
            orderId: orderId
          }
        });
      } else if (status === 'ready') {
        notifications.push({
          userId: fullOrder.patient_id,
          notification: {
            title: 'Commande prête 📦',
            message: `Votre commande #${orderId.slice(-6)} est prête et sera bientôt livrée`,
            type: 'info',
            orderId: orderId
          }
        });
        
        // Si un livreur a été assigné, le notifier
        if (fullOrder.driver_id) {
          notifications.push({
            userId: fullOrder.driver_id,
            notification: {
              title: 'Nouvelle livraison assignée 🚚',
              message: `Vous avez été assigné à la livraison #${orderId.slice(-6)} - ${fullOrder.pharmacy_name}`,
              type: 'info',
              orderId: orderId
            }
          });
        }
      } else if (status === 'in_transit') {
        notifications.push({
          userId: fullOrder.patient_id,
          notification: {
            title: 'Livraison en cours 🚚',
            message: `Votre commande #${orderId.slice(-6)} est en route vers vous`,
            type: 'info',
            orderId: orderId
          }
        });
        
        // Notifier la pharmacie
        if (fullOrder.pharmacy_owner_id) {
          notifications.push({
            userId: fullOrder.pharmacy_owner_id,
            notification: {
              title: 'Livraison en cours 🚚',
              message: `La commande #${orderId.slice(-6)} est en cours de livraison par ${fullOrder.driver_first_name} ${fullOrder.driver_last_name}`,
              type: 'info',
              orderId: orderId
            }
          });
        }
      } else if (status === 'delivered') {
        notifications.push({
          userId: fullOrder.patient_id,
          notification: {
            title: 'Commande livrée ✅',
            message: `Votre commande #${orderId.slice(-6)} a été livrée avec succès`,
            type: 'success',
            orderId: orderId
          }
        });
        
        // Notifier la pharmacie
        if (fullOrder.pharmacy_owner_id) {
          notifications.push({
            userId: fullOrder.pharmacy_owner_id,
            notification: {
              title: 'Commande livrée ✅',
              message: `La commande #${orderId.slice(-6)} a été livrée avec succès par ${fullOrder.driver_first_name} ${fullOrder.driver_last_name}`,
              type: 'success',
              orderId: orderId
            }
          });
        }
      }
    }

    // Send all notifications
    for (const notif of notifications) {
      await sendNotification(notif.userId, notif.notification, req.io);
    }

    res.status(200).json({ 
      message: 'Statut de commande mis à jour avec succès',
      status: status,
      orderId: orderId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Update order status error:', error);
    
    // Gestion d'erreurs spécifiques
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Référence invalide dans la base de données' });
    } else if (error.code === '23505') {
      return res.status(409).json({ error: 'Conflit de données' });
    } else if (error.message.includes('invalid input syntax for type uuid')) {
      return res.status(400).json({ error: 'Format d\'ID invalide' });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    client.release();
  }
};

// Nouvelle fonction pour mettre à jour l'ordonnance d'une commande
export const updateOrderPrescription = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { prescriptionUrl } = req.body;
    const userId = req.user.id;

    // Vérifier que la commande existe et appartient à l'utilisateur
    const orderResult = await pool.query(
      'SELECT id FROM orders WHERE id = $1 AND patient_id = $2',
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée ou non autorisée' });
    }

    // Mettre à jour l'URL de l'ordonnance
    await pool.query(
      'UPDATE orders SET prescription_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [prescriptionUrl, orderId]
    );

    // Ajouter une mise à jour de suivi
    await pool.query(
      'INSERT INTO tracking_updates (order_id, status, message) VALUES ($1, $2, $3)',
      [orderId, 'pending', 'Ordonnance téléchargée par le patient']
    );

    // Notifier le pharmacien
    const pharmacyResult = await pool.query(
      'SELECT p.owner_id, p.name FROM pharmacies p JOIN orders o ON p.id = o.pharmacy_id WHERE o.id = $1',
      [orderId]
    );

    if (pharmacyResult.rows.length > 0) {
      const pharmacy = pharmacyResult.rows[0];
      await sendNotification(
        pharmacy.owner_id,
        {
          title: 'Nouvelle ordonnance reçue',
          message: `Le patient a téléchargé une ordonnance pour la commande #${orderId.slice(-6)}`,
          type: 'info',
          orderId: orderId
        },
        req.io
      );
    }

    res.json({
      message: 'Ordonnance mise à jour avec succès',
      prescriptionUrl: prescriptionUrl
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Nouvelle fonction pour assigner un livreur à une commande
export const assignDriver = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { orderId } = req.params;
    const { driverId } = req.body;
    const userId = req.user.id;
    
    // Vérifier que l'utilisateur est bien le pharmacien propriétaire de la commande
    const orderResult = await client.query(`
      SELECT o.*, p.owner_id, p.name as pharmacy_name
      FROM orders o
      JOIN pharmacies p ON o.pharmacy_id = p.id
      WHERE o.id = $1
    `, [orderId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    const order = orderResult.rows[0];
    
    if (order.owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à assigner un livreur à cette commande' });
    }
    
    // Vérifier que le livreur existe et est actif
    const driverResult = await client.query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND role = $2 AND is_active = true',
      [driverId, 'driver']
    );
    
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Livreur non trouvé ou inactif' });
    }
    
    const driver = driverResult.rows[0];
    
    // Mettre à jour la commande avec le livreur assigné
    await client.query(`
      UPDATE orders 
      SET driver_id = $1, 
          status = CASE WHEN status = 'ready' THEN status ELSE 'ready' END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [driverId, orderId]);
    
    // Ajouter une mise à jour de suivi
    await client.query(`
      INSERT INTO tracking_updates (order_id, status, message)
      VALUES ($1, $2, $3)
    `, [orderId, 'ready', `Livreur assigné: ${driver.first_name} ${driver.last_name}`]);
    
    await client.query('COMMIT');
    
    // Envoyer des notifications
    
    // 1. Notifier le livreur
    await sendNotification(
      driverId,
      {
        title: 'Nouvelle livraison assignée 🚚',
        message: `Vous avez été assigné à la livraison #${orderId.slice(-6)} - ${order.pharmacy_name}`,
        type: 'info',
        orderId: orderId
      },
      req.io
    );
    
    // 2. Notifier le patient
    await sendNotification(
      order.patient_id,
      {
        title: 'Livreur assigné ✅',
        message: `${driver.first_name} ${driver.last_name} a été assigné à votre commande #${orderId.slice(-6)}`,
        type: 'info',
        orderId: orderId
      },
      req.io
    );
    
    res.status(200).json({
      message: 'Livreur assigné avec succès',
      driverId: driverId,
      driverName: `${driver.first_name} ${driver.last_name}`
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Assign driver error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    client.release();
  }
};

// Helper functions
const checkPharmacyOwnership = async (userId, pharmacyId) => {
  const result = await pool.query(
    'SELECT id FROM pharmacies WHERE id = $1 AND owner_id = $2',
    [pharmacyId, userId]
  );
  return result.rows.length > 0;
};

const findNearestDriver = async (latitude, longitude) => {
  if (!latitude || !longitude) return null;
  
  const result = await pool.query(`
    SELECT u.id, u.first_name, u.last_name,
           dl.latitude, dl.longitude,
           (6371 * acos(cos(radians($1)) * cos(radians(dl.latitude)) * cos(radians(dl.longitude) - radians($2)) + sin(radians($1)) * sin(radians(dl.latitude)))) AS distance
    FROM users u
    JOIN driver_locations dl ON u.id = dl.driver_id
    WHERE u.role = 'driver' AND u.is_active = true AND dl.is_available = true
    ORDER BY distance
    LIMIT 1
  `, [latitude, longitude]);

  return result.rows[0] || null;
};