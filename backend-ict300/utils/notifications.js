import pool from '../config/database.js';

export const sendNotification = async (userId, { title, message, type = 'info', orderId = null }, io = null) => {
  try {
    // Vérifier d'abord si l'utilisateur existe
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length === 0) {
      console.warn(`⚠️ Tentative d'envoi de notification à un utilisateur inexistant (ID: ${userId})`);
      return null; // Sortir sans erreur si l'utilisateur n'existe pas
    }
    
    // Insérer la notification en base de données
    const result = await pool.query(`
      INSERT INTO notifications (user_id, title, message, type, order_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, title, message, type, orderId]);

    const notification = result.rows[0];

    // Formater la notification pour l'envoi
    const formattedNotification = {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      orderId: notification.order_id,
      isRead: notification.is_read,
      createdAt: notification.created_at
    };

    // Envoyer la notification en temps réel via Socket.IO si disponible
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', formattedNotification);
      console.log(`📱 Notification envoyée en temps réel à l'utilisateur ${userId}: ${title}`);
    }

    console.log(`✅ Notification sauvegardée pour l'utilisateur ${userId}: ${title}`);
    return formattedNotification;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de notification:', error);
    // Ne pas propager l'erreur pour éviter de bloquer le flux principal
    return null;
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    let query = `
      SELECT n.*, o.id as order_number
      FROM notifications n
      LEFT JOIN orders o ON n.order_id = o.id
      WHERE n.user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (unreadOnly === 'true') {
      paramCount++;
      query += ` AND n.is_read = false`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Compter le nombre total de notifications non lues
    const unreadCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    const notifications = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.is_read,
      orderId: row.order_id,
      orderNumber: row.order_number,
      createdAt: row.created_at
    }));

    res.json({
      notifications,
      unreadCount: parseInt(unreadCountResult.rows[0].count),
      total: notifications.length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    await pool.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
    `, [notificationId, userId]);

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    await pool.query(`
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
    `, [notificationId, userId]);

    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};