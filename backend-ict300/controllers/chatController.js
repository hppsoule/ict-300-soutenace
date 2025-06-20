import pool from '../config/database.js';

export const getMessages = async (req, res) => {
  try {
    const { orderId, recipientId } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT cm.*, 
             u_sender.first_name as sender_first_name, u_sender.last_name as sender_last_name, u_sender.role as sender_role,
             u_recipient.first_name as recipient_first_name, u_recipient.last_name as recipient_last_name, u_recipient.role as recipient_role
      FROM chat_messages cm
      LEFT JOIN users u_sender ON cm.sender_id = u_sender.id
      LEFT JOIN users u_recipient ON cm.recipient_id = u_recipient.id
      WHERE (cm.sender_id = $1 OR cm.recipient_id = $1)
    `;

    const params = [userId];
    let paramCount = 1;

    if (orderId) {
      paramCount++;
      query += ` AND cm.order_id = $${paramCount}`;
      params.push(orderId);
    }

    if (recipientId) {
      paramCount++;
      query += ` AND ((cm.sender_id = $1 AND cm.recipient_id = $${paramCount}) OR (cm.sender_id = $${paramCount} AND cm.recipient_id = $1))`;
      params.push(recipientId);
    }

    query += ' ORDER BY cm.created_at ASC';

    const result = await pool.query(query, params);

    const messages = result.rows.map(row => ({
      id: row.id,
      senderId: row.sender_id,
      senderName: `${row.sender_first_name} ${row.sender_last_name}`,
      senderRole: row.sender_role,
      recipientId: row.recipient_id,
      recipientName: `${row.recipient_first_name} ${row.recipient_last_name}`,
      recipientRole: row.recipient_role,
      message: row.message,
      orderId: row.order_id,
      isRead: row.is_read,
      timestamp: row.created_at
    }));

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, message, orderId } = req.body;
    const senderId = req.user.id;

    console.log('📨 Tentative d\'envoi de message:', {
      senderId,
      recipientId,
      orderId,
      message: message.substring(0, 50) + '...'
    });

    // Vérifier que le destinataire existe
    const recipientCheck = await pool.query(
      'SELECT id, first_name, last_name, role FROM users WHERE id = $1',
      [recipientId]
    );

    if (recipientCheck.rows.length === 0) {
      console.error('❌ Destinataire non trouvé:', recipientId);
      
      // Si le recipientId est un ID de pharmacie, essayons de trouver le propriétaire
      const pharmacyOwnerCheck = await pool.query(
        'SELECT owner_id FROM pharmacies WHERE id = $1',
        [recipientId]
      );
      
      if (pharmacyOwnerCheck.rows.length > 0) {
        const pharmacyOwnerId = pharmacyOwnerCheck.rows[0].owner_id;
        
        // Vérifier que le propriétaire existe
        const ownerCheck = await pool.query(
          'SELECT id, first_name, last_name, role FROM users WHERE id = $1',
          [pharmacyOwnerId]
        );
        
        if (ownerCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Propriétaire de la pharmacie non trouvé' });
        }
        
        // Utiliser le propriétaire comme destinataire
        const recipient = ownerCheck.rows[0];
        console.log('✅ Propriétaire de pharmacie trouvé comme destinataire:', recipient);
        
        // Insérer le message avec le propriétaire comme destinataire
        const result = await pool.query(`
          INSERT INTO chat_messages (sender_id, recipient_id, message, order_id)
          VALUES ($1, $2, $3, $4)
          RETURNING id, created_at
        `, [senderId, pharmacyOwnerId, message, orderId || null]);
        
        const messageId = result.rows[0].id;
        const timestamp = result.rows[0].created_at;
        
        // Get sender info
        const senderResult = await pool.query(
          'SELECT first_name, last_name, role FROM users WHERE id = $1',
          [senderId]
        );
        
        const sender = senderResult.rows[0];
        
        const messageData = {
          id: messageId,
          senderId: senderId,
          senderName: `${sender.first_name} ${sender.last_name}`,
          senderRole: sender.role,
          recipientId: pharmacyOwnerId,
          recipientName: `${recipient.first_name} ${recipient.last_name}`,
          recipientRole: recipient.role,
          message: message,
          orderId: orderId || null,
          isRead: false,
          timestamp: timestamp
        };
        
        console.log('✅ Message envoyé au propriétaire de la pharmacie:', messageData);
        
        // Emit to recipient via Socket.IO (if connected)
        req.io?.to(`user_${pharmacyOwnerId}`).emit('new_message', messageData);
        
        return res.status(201).json({
          message: 'Message sent successfully to pharmacy owner',
          data: messageData
        });
      }
      
      return res.status(404).json({ error: 'Destinataire non trouvé' });
    }

    const recipient = recipientCheck.rows[0];
    console.log('✅ Destinataire trouvé:', recipient);

    // Vérifier que la commande existe si orderId est fourni
    if (orderId) {
      const orderCheck = await pool.query(
        'SELECT id FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderCheck.rows.length === 0) {
        console.error('❌ Commande non trouvée:', orderId);
        return res.status(404).json({ error: 'Commande non trouvée' });
      }
    }

    // Insérer le message
    const result = await pool.query(`
      INSERT INTO chat_messages (sender_id, recipient_id, message, order_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `, [senderId, recipientId, message, orderId || null]);

    const messageId = result.rows[0].id;
    const timestamp = result.rows[0].created_at;

    // Get sender info
    const senderResult = await pool.query(
      'SELECT first_name, last_name, role FROM users WHERE id = $1',
      [senderId]
    );

    const sender = senderResult.rows[0];

    const messageData = {
      id: messageId,
      senderId: senderId,
      senderName: `${sender.first_name} ${sender.last_name}`,
      senderRole: sender.role,
      recipientId: recipientId,
      recipientName: `${recipient.first_name} ${recipient.last_name}`,
      recipientRole: recipient.role,
      message: message,
      orderId: orderId || null,
      isRead: false,
      timestamp: timestamp
    };

    console.log('✅ Message envoyé avec succès:', messageData);

    // Emit to recipient via Socket.IO (if connected)
    req.io?.to(`user_${recipientId}`).emit('new_message', messageData);

    res.status(201).json({
      message: 'Message sent successfully',
      data: messageData
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { senderId, orderId } = req.body;
    const recipientId = req.user.id;

    let query = 'UPDATE chat_messages SET is_read = true WHERE recipient_id = $1 AND sender_id = $2';
    const params = [recipientId, senderId];

    if (orderId) {
      query += ' AND order_id = $3';
      params.push(orderId);
    }

    await pool.query(query, params);

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChatContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT DISTINCT 
        CASE 
          WHEN cm.sender_id = $1 THEN cm.recipient_id 
          ELSE cm.sender_id 
        END as contact_id,
        CASE 
          WHEN cm.sender_id = $1 THEN u_recipient.first_name 
          ELSE u_sender.first_name 
        END as contact_first_name,
        CASE 
          WHEN cm.sender_id = $1 THEN u_recipient.last_name 
          ELSE u_sender.last_name 
        END as contact_last_name,
        CASE 
          WHEN cm.sender_id = $1 THEN u_recipient.role 
          ELSE u_sender.role 
        END as contact_role,
        cm.order_id,
        MAX(cm.created_at) as last_message_time,
        COUNT(CASE WHEN cm.recipient_id = $1 AND cm.is_read = false THEN 1 END) as unread_count
      FROM chat_messages cm
      LEFT JOIN users u_sender ON cm.sender_id = u_sender.id
      LEFT JOIN users u_recipient ON cm.recipient_id = u_recipient.id
      WHERE cm.sender_id = $1 OR cm.recipient_id = $1
      GROUP BY contact_id, contact_first_name, contact_last_name, contact_role, cm.order_id
      ORDER BY last_message_time DESC
    `, [userId]);

    const contacts = result.rows.map(row => ({
      id: row.contact_id,
      name: `${row.contact_first_name} ${row.contact_last_name}`,
      role: row.contact_role,
      orderId: row.order_id,
      lastMessageTime: row.last_message_time,
      unreadCount: parseInt(row.unread_count)
    }));

    res.json(contacts);
  } catch (error) {
    console.error('Get chat contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Nouvelle fonction pour obtenir les contacts disponibles pour un utilisateur
export const getAvailableContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let contacts = [];

    if (userRole === 'patient') {
      // Les patients peuvent contacter les pharmaciens et livreurs de leurs commandes
      const result = await pool.query(`
        SELECT DISTINCT 
          CASE 
            WHEN p.owner_id IS NOT NULL THEN p.owner_id
            WHEN o.driver_id IS NOT NULL THEN o.driver_id
            ELSE NULL
          END as contact_id,
          CASE 
            WHEN p.owner_id IS NOT NULL THEN CONCAT(u_pharm.first_name, ' ', u_pharm.last_name)
            WHEN o.driver_id IS NOT NULL THEN CONCAT(u_driver.first_name, ' ', u_driver.last_name)
            ELSE NULL
          END as contact_name,
          CASE 
            WHEN p.owner_id IS NOT NULL THEN 'pharmacist'
            WHEN o.driver_id IS NOT NULL THEN 'driver'
            ELSE NULL
          END as contact_role,
          o.id as order_id,
          CASE 
            WHEN p.owner_id IS NOT NULL THEN p.name
            WHEN o.driver_id IS NOT NULL THEN 'Livreur'
            ELSE NULL
          END as contact_description
        FROM orders o
        LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
        LEFT JOIN users u_pharm ON p.owner_id = u_pharm.id
        LEFT JOIN users u_driver ON o.driver_id = u_driver.id
        WHERE o.patient_id = $1 
          AND (p.owner_id IS NOT NULL OR o.driver_id IS NOT NULL)
        ORDER BY o.created_at DESC
      `, [userId]);

      contacts = result.rows
        .filter(row => row.contact_id)
        .map(row => ({
          id: row.contact_id,
          name: row.contact_name,
          role: row.contact_role,
          orderId: row.order_id,
          description: row.contact_description
        }));

    } else if (userRole === 'pharmacist') {
      // Les pharmaciens peuvent contacter les patients et livreurs de leurs commandes
      const result = await pool.query(`
        SELECT DISTINCT 
          CASE 
            WHEN o.patient_id IS NOT NULL THEN o.patient_id
            WHEN o.driver_id IS NOT NULL THEN o.driver_id
            ELSE NULL
          END as contact_id,
          CASE 
            WHEN o.patient_id IS NOT NULL THEN CONCAT(u_patient.first_name, ' ', u_patient.last_name)
            WHEN o.driver_id IS NOT NULL THEN CONCAT(u_driver.first_name, ' ', u_driver.last_name)
            ELSE NULL
          END as contact_name,
          CASE 
            WHEN o.patient_id IS NOT NULL THEN 'patient'
            WHEN o.driver_id IS NOT NULL THEN 'driver'
            ELSE NULL
          END as contact_role,
          o.id as order_id
        FROM orders o
        LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
        LEFT JOIN users u_patient ON o.patient_id = u_patient.id
        LEFT JOIN users u_driver ON o.driver_id = u_driver.id
        WHERE p.owner_id = $1 
          AND (o.patient_id IS NOT NULL OR o.driver_id IS NOT NULL)
        ORDER BY o.created_at DESC
      `, [userId]);

      contacts = result.rows
        .filter(row => row.contact_id)
        .map(row => ({
          id: row.contact_id,
          name: row.contact_name,
          role: row.contact_role,
          orderId: row.order_id
        }));

    } else if (userRole === 'driver') {
      // Les livreurs peuvent contacter les patients et pharmaciens de leurs livraisons
      const result = await pool.query(`
        SELECT DISTINCT 
          CASE 
            WHEN o.patient_id IS NOT NULL THEN o.patient_id
            WHEN p.owner_id IS NOT NULL THEN p.owner_id
            ELSE NULL
          END as contact_id,
          CASE 
            WHEN o.patient_id IS NOT NULL THEN CONCAT(u_patient.first_name, ' ', u_patient.last_name)
            WHEN p.owner_id IS NOT NULL THEN CONCAT(u_pharm.first_name, ' ', u_pharm.last_name)
            ELSE NULL
          END as contact_name,
          CASE 
            WHEN o.patient_id IS NOT NULL THEN 'patient'
            WHEN p.owner_id IS NOT NULL THEN 'pharmacist'
            ELSE NULL
          END as contact_role,
          o.id as order_id,
          CASE 
            WHEN o.patient_id IS NOT NULL THEN 'Patient'
            WHEN p.owner_id IS NOT NULL THEN p.name
            ELSE NULL
          END as contact_description
        FROM orders o
        LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
        LEFT JOIN users u_patient ON o.patient_id = u_patient.id
        LEFT JOIN users u_pharm ON p.owner_id = u_pharm.id
        WHERE o.driver_id = $1 
          AND (o.patient_id IS NOT NULL OR p.owner_id IS NOT NULL)
        ORDER BY o.created_at DESC
      `, [userId]);

      contacts = result.rows
        .filter(row => row.contact_id)
        .map(row => ({
          id: row.contact_id,
          name: row.contact_name,
          role: row.contact_role,
          orderId: row.order_id,
          description: row.contact_description
        }));
    }

    res.json(contacts);
  } catch (error) {
    console.error('Get available contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};