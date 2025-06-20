import pool from '../config/database.js';
import { sendNotification } from '../utils/notifications.js';

export const processPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { orderId, paymentMethod, paymentData } = req.body;
    const patientId = req.user.id;

    console.log('🔄 Traitement du paiement:', {
      orderId,
      paymentMethod,
      patientId
    });

    // Vérifier que la commande existe et appartient au patient
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND patient_id = $2',
      [orderId, patientId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Commande non trouvée');
    }

    const order = orderResult.rows[0];

    // Vérifier que la commande est validée
    if (order.status !== 'validated') {
      throw new Error('La commande doit être validée avant le paiement');
    }

    // Simuler le traitement du paiement (ici on accepte tous les paiements)
    const paymentSuccess = true; // Dans un vrai système, intégrer Stripe/PayPal

    if (!paymentSuccess) {
      throw new Error('Échec du paiement');
    }

    // Mettre à jour la commande
    await client.query(`
      UPDATE orders 
      SET status = $1, 
          payment_method = $2, 
          payment_status = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, ['paid', paymentMethod, 'completed', orderId]);

    // Ajouter une mise à jour de suivi
    await client.query(`
      INSERT INTO tracking_updates (order_id, status, message)
      VALUES ($1, $2, $3)
    `, [orderId, 'paid', 'Paiement effectué avec succès']);

    await client.query('COMMIT');

    // Récupérer les informations complètes pour les notifications
    const fullOrderResult = await client.query(`
      SELECT o.*, 
             u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
             p.name as pharmacy_name, p.owner_id as pharmacy_owner_id,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u_patient ON o.patient_id = u_patient.id
      LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id, u_patient.first_name, u_patient.last_name, p.name, p.owner_id
    `, [orderId]);

    const fullOrder = fullOrderResult.rows[0];

    // 🔔 NOTIFICATIONS AUTOMATIQUES

    // 1. Notifier la pharmacie
    if (fullOrder.pharmacy_owner_id) {
      await sendNotification(
        fullOrder.pharmacy_owner_id,
        {
          title: 'Paiement reçu 💳',
          message: `Paiement de €${fullOrder.total} reçu pour la commande #${orderId.slice(-6)} de ${fullOrder.patient_first_name} ${fullOrder.patient_last_name}`,
          type: 'success',
          orderId: orderId
        },
        req.io
      );
    }

    // 2. Notifier tous les admins
    const adminsResult = await pool.query(
      'SELECT id FROM users WHERE role = $1 AND is_active = true',
      ['admin']
    );

    for (const admin of adminsResult.rows) {
      await sendNotification(
        admin.id,
        {
          title: 'Nouveau paiement 💰',
          message: `Paiement de €${fullOrder.total} reçu - Commande #${orderId.slice(-6)} (${fullOrder.pharmacy_name})`,
          type: 'info',
          orderId: orderId
        },
        req.io
      );
    }

    // 3. Confirmer au patient
    await sendNotification(
      patientId,
      {
        title: 'Paiement confirmé ✅',
        message: `Votre paiement de €${fullOrder.total} a été traité avec succès. La pharmacie va préparer votre commande.`,
        type: 'success',
        orderId: orderId
      },
      req.io
    );

    console.log('✅ Paiement traité et notifications envoyées');

    res.status(200).json({
      message: 'Paiement traité avec succès',
      orderId: orderId,
      paymentStatus: 'completed'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur de traitement du paiement:', error);
    res.status(400).json({ error: error.message || 'Erreur de paiement' });
  } finally {
    client.release();
  }
};

export const validatePayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { orderId } = req.params;
    const pharmacistId = req.user.id;

    console.log('🔄 Validation du paiement par le pharmacien:', {
      orderId,
      pharmacistId
    });

    // Vérifier que la commande appartient à la pharmacie du pharmacien
    const orderResult = await client.query(`
      SELECT o.*, p.owner_id, p.name as pharmacy_name,
             u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
             u_patient.id as patient_id
      FROM orders o
      JOIN pharmacies p ON o.pharmacy_id = p.id
      LEFT JOIN users u_patient ON o.patient_id = u_patient.id
      WHERE o.id = $1 AND p.owner_id = $2
    `, [orderId, pharmacistId]);

    if (orderResult.rows.length === 0) {
      throw new Error('Commande non trouvée ou accès refusé');
    }

    const order = orderResult.rows[0];

    // Vérifier que la commande est payée
    if (order.status !== 'paid') {
      throw new Error('La commande doit être payée avant validation');
    }

    // Mettre à jour le statut vers "preparing"
    await client.query(`
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, ['preparing', orderId]);

    // Ajouter une mise à jour de suivi
    await client.query(`
      INSERT INTO tracking_updates (order_id, status, message)
      VALUES ($1, $2, $3)
    `, [orderId, 'preparing', 'Paiement validé - Préparation en cours']);

    await client.query('COMMIT');

    // 🔔 NOTIFICATIONS AUTOMATIQUES

    // 1. Notifier le patient
    if (order.patient_id) {
      await sendNotification(
        order.patient_id,
        {
          title: 'Préparation commencée 🔄',
          message: `Votre paiement a été validé. ${order.pharmacy_name} prépare votre commande #${orderId.slice(-6)}`,
          type: 'info',
          orderId: orderId
        },
        req.io
      );
    }

    // 2. Notifier tous les livreurs disponibles
    const driversResult = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, dl.latitude, dl.longitude
      FROM users u
      JOIN driver_locations dl ON u.id = dl.driver_id
      WHERE u.role = 'driver' AND u.is_active = true AND dl.is_available = true
    `);

    for (const driver of driversResult.rows) {
      await sendNotification(
        driver.id,
        {
          title: 'Nouvelle livraison disponible 🚚',
          message: `Livraison vers ${order.delivery_city} - €${order.total} - Distance estimée: 2.5km`,
          type: 'info',
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
          title: 'Commande en préparation 📦',
          message: `Commande #${orderId.slice(-6)} validée par ${order.pharmacy_name} - En attente de livreur`,
          type: 'info',
          orderId: orderId
        },
        req.io
      );
    }

    console.log('✅ Paiement validé et notifications envoyées aux livreurs');

    res.status(200).json({
      message: 'Paiement validé avec succès',
      orderId: orderId,
      status: 'preparing'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur de validation du paiement:', error);
    res.status(400).json({ error: error.message || 'Erreur de validation' });
  } finally {
    client.release();
  }
};

export const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'card',
        name: 'Carte bancaire',
        description: 'Visa, Mastercard, American Express',
        icon: '💳',
        enabled: true
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Paiement sécurisé via PayPal',
        icon: '🅿️',
        enabled: true
      },
      {
        id: 'apple_pay',
        name: 'Apple Pay',
        description: 'Paiement rapide avec Touch ID',
        icon: '🍎',
        enabled: true
      },
      {
        id: 'google_pay',
        name: 'Google Pay',
        description: 'Paiement rapide avec Google',
        icon: '🔵',
        enabled: true
      }
    ];

    res.json(paymentMethods);
  } catch (error) {
    console.error('Erreur récupération méthodes de paiement:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};