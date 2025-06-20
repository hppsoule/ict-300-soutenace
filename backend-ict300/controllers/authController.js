import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { sendEmail } from '../utils/email.js';

export const register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      role,
      // Champs spécifiques aux pharmaciens
      licenseNumber,
      pharmacyDegree,
      specialization,
      yearsExperience,
      professionalOrderNumber,
      // Champs spécifiques aux livreurs
      licenseType,
      licenseExpiryDate,
      vehicleType,
      vehicleRegistration,
      insuranceNumber,
      insuranceExpiryDate
    } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new Error('Un utilisateur existe déjà avec cet email');
    }

    // Vérifications spécifiques selon le rôle
    if (role === 'pharmacist' && licenseNumber) {
      const existingLicense = await client.query(
        'SELECT id FROM pharmacist_profiles WHERE license_number = $1', 
        [licenseNumber]
      );
      if (existingLicense.rows.length > 0) {
        throw new Error('Ce numéro de licence pharmacien est déjà utilisé');
      }
    }

    if (role === 'driver' && licenseNumber) {
      const existingDriverLicense = await client.query(
        'SELECT id FROM driver_profiles WHERE license_number = $1', 
        [licenseNumber]
      );
      if (existingDriverLicense.rows.length > 0) {
        throw new Error('Ce numéro de permis de conduire est déjà utilisé');
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Déterminer le statut de vérification selon le rôle
    let isVerified = false;
    let isActive = false;

    // Les patients sont automatiquement vérifiés et actifs
    if (role === 'patient') {
      isVerified = true;
      isActive = true;
    }

    // Créer l'utilisateur
    const result = await client.query(`
      INSERT INTO users (email, password, first_name, last_name, phone, role, is_verified, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, phone, role, is_active, is_verified, created_at
    `, [email, hashedPassword, firstName, lastName, phone, role, isVerified, isActive]);

    const user = result.rows[0];

    // Créer le profil spécifique selon le rôle
    if (role === 'pharmacist' && licenseNumber) {
      await client.query(`
        INSERT INTO pharmacist_profiles (
          user_id, license_number, pharmacy_degree, specialization, 
          years_experience, professional_order_number
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        user.id, 
        licenseNumber, 
        pharmacyDegree || null, 
        specialization || null,
        yearsExperience || 0,
        professionalOrderNumber || null
      ]);
    }

    if (role === 'driver' && licenseNumber) {
      await client.query(`
        INSERT INTO driver_profiles (
          user_id, license_number, license_type, license_expiry_date,
          vehicle_type, vehicle_registration, insurance_number, insurance_expiry_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        user.id,
        licenseNumber,
        licenseType || 'B',
        licenseExpiryDate || null,
        vehicleType || null,
        vehicleRegistration || null,
        insuranceNumber || null,
        insuranceExpiryDate || null
      ]);
    }

    await client.query('COMMIT');

    // Envoyer un email selon le rôle
    if (role === 'patient') {
      await sendEmail({
        to: email,
        subject: 'Bienvenue sur PharmaDelivery!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0066CC;">Bienvenue sur PharmaDelivery!</h2>
            <p>Bonjour ${firstName} ${lastName},</p>
            <p>Votre compte patient a été créé avec succès. Vous pouvez maintenant vous connecter et commencer à commander vos médicaments.</p>
            <p>Cordialement,<br>L'équipe PharmaDelivery</p>
          </div>
        `
      });
    } else {
      // Pour pharmaciens et livreurs - en attente d'approbation admin
      await sendEmail({
        to: email,
        subject: 'Compte créé - En attente d\'approbation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0066CC;">Compte créé sur PharmaDelivery</h2>
            <p>Bonjour ${firstName} ${lastName},</p>
            <p>Votre compte ${role === 'pharmacist' ? 'pharmacien' : 'livreur'} a été créé avec succès.</p>
            <p><strong>Votre compte est actuellement en attente d'approbation par un administrateur.</strong></p>
            <p>Vous recevrez un email de confirmation une fois votre compte approuvé.</p>
            <p>Cordialement,<br>L'équipe PharmaDelivery</p>
          </div>
        `
      });

      // Notifier les admins
      const admins = await client.query('SELECT email FROM users WHERE role = $1 AND is_active = true', ['admin']);
      for (const admin of admins.rows) {
        await sendEmail({
          to: admin.email,
          subject: 'Nouvelle demande d\'inscription',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0066CC;">Nouvelle demande d'inscription</h2>
              <p>Un nouveau ${role === 'pharmacist' ? 'pharmacien' : 'livreur'} s'est inscrit :</p>
              <ul>
                <li><strong>Nom:</strong> ${firstName} ${lastName}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Téléphone:</strong> ${phone}</li>
                <li><strong>Rôle:</strong> ${role === 'pharmacist' ? 'Pharmacien' : 'Livreur'}</li>
                ${role === 'pharmacist' && licenseNumber ? `<li><strong>N° Licence:</strong> ${licenseNumber}</li>` : ''}
                ${role === 'driver' && licenseNumber ? `<li><strong>N° Permis:</strong> ${licenseNumber}</li>` : ''}
              </ul>
              <p>Connectez-vous à l'interface d'administration pour approuver ou rejeter cette demande.</p>
            </div>
          `
        });
      }
    }

    // Générer un token JWT seulement pour les patients actifs
    let token = null;
    if (isActive) {
      token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
    }

    res.status(201).json({
      message: role === 'patient' 
        ? 'Compte créé avec succès' 
        : 'Compte créé avec succès. En attente d\'approbation par un administrateur.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified,
        createdAt: user.created_at
      },
      token,
      requiresApproval: !isActive
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Récupérer l'utilisateur de la base de données
    const result = await pool.query(
      'SELECT id, email, password, first_name, last_name, phone, role, is_active, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier si le compte est actif
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Votre compte est en attente d\'approbation par un administrateur',
        code: 'ACCOUNT_PENDING'
      });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified
      },
      token
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.avatar_url, u.is_active, u.is_verified, u.created_at,
             a.street, a.city, a.postal_code, a.country, a.latitude, a.longitude,
             ua.avatar_url as user_avatar_url,
             pp.license_number as pharmacist_license, pp.pharmacy_degree, pp.specialization, pp.years_experience,
             dp.license_number as driver_license, dp.license_type, dp.license_expiry_date, dp.vehicle_type, dp.vehicle_registration
      FROM users u
      LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = true
      LEFT JOIN user_avatars ua ON u.id = ua.user_id
      LEFT JOIN pharmacist_profiles pp ON u.id = pp.user_id
      LEFT JOIN driver_profiles dp ON u.id = dp.user_id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];
    
    const profileData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.user_avatar_url || user.avatar_url,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      address: user.street ? {
        street: user.street,
        city: user.city,
        postalCode: user.postal_code,
        country: user.country,
        coordinates: user.latitude && user.longitude ? {
          lat: parseFloat(user.latitude),
          lng: parseFloat(user.longitude)
        } : null
      } : null
    };

    // Ajouter les informations spécifiques selon le rôle
    if (user.role === 'pharmacist' && user.pharmacist_license) {
      profileData.pharmacistProfile = {
        licenseNumber: user.pharmacist_license,
        pharmacyDegree: user.pharmacy_degree,
        specialization: user.specialization,
        yearsExperience: user.years_experience
      };
    }

    if (user.role === 'driver' && user.driver_license) {
      profileData.driverProfile = {
        licenseNumber: user.driver_license,
        licenseType: user.license_type,
        licenseExpiryDate: user.license_expiry_date,
        vehicleType: user.vehicle_type,
        vehicleRegistration: user.vehicle_registration
      };
    }

    res.json(profileData);
  } catch (error) {
    console.error('Erreur de récupération du profil:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatarUrl, originalFilename, fileSize, mimeType } = req.body;

    // Supprimer l'ancien avatar s'il existe
    await pool.query('DELETE FROM user_avatars WHERE user_id = $1', [userId]);

    // Insérer le nouvel avatar
    await pool.query(`
      INSERT INTO user_avatars (user_id, avatar_url, original_filename, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, avatarUrl, originalFilename, fileSize, mimeType]);

    res.json({
      message: 'Avatar mis à jour avec succès',
      avatarUrl: avatarUrl
    });
  } catch (error) {
    console.error('Erreur de mise à jour de l\'avatar:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Mise à jour du profil
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone } = req.body;

    // Mettre à jour les informations de base
    await pool.query(`
      UPDATE users 
      SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [firstName, lastName, phone, userId]);

    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        firstName,
        lastName,
        phone
      }
    });
  } catch (error) {
    console.error('Erreur de mise à jour du profil:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Mise à jour ou ajout d'adresse
export const updateAddress = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.user.id;
    const { street, city, postalCode, country, latitude, longitude, isDefault = true } = req.body;

    // Vérifier si l'utilisateur a déjà une adresse par défaut
    const existingAddress = await client.query(
      'SELECT id FROM addresses WHERE user_id = $1 AND is_default = true',
      [userId]
    );

    if (existingAddress.rows.length > 0) {
      // Mettre à jour l'adresse existante
      await client.query(`
        UPDATE addresses 
        SET street = $1, city = $2, postal_code = $3, country = $4, 
            latitude = $5, longitude = $6
        WHERE user_id = $7 AND is_default = true
      `, [street, city, postalCode, country, latitude || null, longitude || null, userId]);
    } else {
      // Créer une nouvelle adresse
      await client.query(`
        INSERT INTO addresses (user_id, street, city, postal_code, country, latitude, longitude, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, street, city, postalCode, country, latitude || null, longitude || null, isDefault]);
    }

    await client.query('COMMIT');

    res.json({
      message: 'Adresse mise à jour avec succès',
      address: {
        street,
        city,
        postalCode,
        country,
        coordinates: latitude && longitude ? { lat: latitude, lng: longitude } : null
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur de mise à jour de l\'adresse:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    client.release();
  }
};

// Changement de mot de passe
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Récupérer le mot de passe actuel
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await pool.query(`
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [hashedPassword, userId]);

    res.json({
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur de changement de mot de passe:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Mise à jour des préférences de notification
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // Dans une vraie application, on stockerait ces préférences dans une table dédiée
    // Pour cette démo, on simule une mise à jour réussie
    
    res.json({
      message: 'Préférences de notification mises à jour avec succès',
      preferences
    });
  } catch (error) {
    console.error('Erreur de mise à jour des préférences:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Nouvelles fonctions pour la gestion admin
export const getPendingUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at,
             pp.license_number as pharmacist_license, pp.pharmacy_degree, pp.specialization,
             dp.license_number as driver_license, dp.license_type, dp.vehicle_type
      FROM users u
      LEFT JOIN pharmacist_profiles pp ON u.id = pp.user_id
      LEFT JOIN driver_profiles dp ON u.id = dp.user_id
      WHERE u.is_active = false AND u.role IN ('pharmacist', 'driver')
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
      pharmacistProfile: user.pharmacist_license ? {
        licenseNumber: user.pharmacist_license,
        pharmacyDegree: user.pharmacy_degree,
        specialization: user.specialization
      } : null,
      driverProfile: user.driver_license ? {
        licenseNumber: user.driver_license,
        licenseType: user.license_type,
        vehicleType: user.vehicle_type
      } : null
    })));
  } catch (error) {
    console.error('Erreur de récupération des utilisateurs en attente:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const approveUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { userId } = req.params;

    // Récupérer les informations de l'utilisateur
    const userResult = await client.query(
      'SELECT email, first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Utilisateur non trouvé');
    }

    const user = userResult.rows[0];

    // Approuver l'utilisateur
    await client.query(
      'UPDATE users SET is_active = true, is_verified = true WHERE id = $1',
      [userId]
    );

    // Si c'est un pharmacien, créer automatiquement sa pharmacie
    if (user.role === 'pharmacist') {
      // Vérifier s'il n'a pas déjà une pharmacie
      const existingPharmacy = await client.query(
        'SELECT id FROM pharmacies WHERE owner_id = $1',
        [userId]
      );

      if (existingPharmacy.rows.length === 0) {
        // Créer une pharmacie par défaut pour le pharmacien
        const pharmacyResult = await client.query(`
          INSERT INTO pharmacies (
            name, owner_id, street, city, postal_code, country, 
            latitude, longitude, phone, email, is_approved, is_open
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          `Pharmacie de ${user.first_name} ${user.last_name}`,
          userId,
          'Adresse à compléter',
          'Ville à compléter',
          '00000',
          'France',
          48.8566, // Coordonnées par défaut (Paris)
          2.3522,
          '+33000000000', // Téléphone par défaut
          user.email,
          true, // Approuvée automatiquement
          true  // Ouverte par défaut
        ]);

        const pharmacyId = pharmacyResult.rows[0].id;

        // Ajouter des horaires d'ouverture par défaut
        const defaultHours = [
          { day: 1, open: '08:00', close: '19:00' }, // Lundi
          { day: 2, open: '08:00', close: '19:00' }, // Mardi
          { day: 3, open: '08:00', close: '19:00' }, // Mercredi
          { day: 4, open: '08:00', close: '19:00' }, // Jeudi
          { day: 5, open: '08:00', close: '19:00' }, // Vendredi
          { day: 6, open: '09:00', close: '18:00' }, // Samedi
          { day: 0, open: '10:00', close: '17:00' }  // Dimanche
        ];

        for (const hours of defaultHours) {
          await client.query(`
            INSERT INTO opening_hours (pharmacy_id, day_of_week, open_time, close_time)
            VALUES ($1, $2, $3, $4)
          `, [pharmacyId, hours.day, hours.open, hours.close]);
        }

        console.log(`Pharmacie créée automatiquement pour ${user.first_name} ${user.last_name} (ID: ${pharmacyId})`);
      }
    }

    await client.query('COMMIT');

    // Envoyer un email de confirmation
    await sendEmail({
      to: user.email,
      subject: 'Compte approuvé - PharmaDelivery',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066CC;">Compte approuvé!</h2>
          <p>Bonjour ${user.first_name} ${user.last_name},</p>
          <p>Excellente nouvelle! Votre compte ${user.role === 'pharmacist' ? 'pharmacien' : 'livreur'} a été approuvé par notre équipe.</p>
          <p>Vous pouvez maintenant vous connecter à votre compte et commencer à utiliser PharmaDelivery.</p>
          ${user.role === 'pharmacist' ? '<p><strong>Une pharmacie a été automatiquement créée pour vous.</strong> Vous pourrez modifier ses informations (adresse, horaires, etc.) depuis votre tableau de bord.</p>' : ''}
          <p>Cordialement,<br>L'équipe PharmaDelivery</p>
        </div>
      `
    });

    res.json({ 
      message: 'Utilisateur approuvé avec succès',
      pharmacyCreated: user.role === 'pharmacist'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur d\'approbation de l\'utilisateur:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  } finally {
    client.release();
  }
};

export const rejectUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { userId } = req.params;
    const { reason } = req.body;

    // Récupérer les informations de l'utilisateur
    const userResult = await client.query(
      'SELECT email, first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Utilisateur non trouvé');
    }

    const user = userResult.rows[0];

    // Supprimer d'abord les notifications liées aux commandes de l'utilisateur
    if (user.role === 'patient') {
      // Récupérer les IDs des commandes du patient
      const orderIdsResult = await client.query(
        'SELECT id FROM orders WHERE patient_id = $1',
        [userId]
      );
      
      // Supprimer les notifications liées à ces commandes
      for (const orderRow of orderIdsResult.rows) {
        await client.query('DELETE FROM notifications WHERE order_id = $1', [orderRow.id]);
      }
      
      // Pour chaque commande, supprimer les articles associés
      for (const orderRow of orderIdsResult.rows) {
        await client.query('DELETE FROM order_items WHERE order_id = $1', [orderRow.id]);
        await client.query('DELETE FROM tracking_updates WHERE order_id = $1', [orderRow.id]);
      }
      
      // Supprimer toutes les commandes du patient
      await client.query('DELETE FROM orders WHERE patient_id = $1', [userId]);
    }
    
    // Si c'est un pharmacien, gérer les médicaments et les pharmacies
    if (user.role === 'pharmacist') {
      // Récupérer les IDs des pharmacies du pharmacien
      const pharmacyIdsResult = await client.query(
        'SELECT id FROM pharmacies WHERE owner_id = $1',
        [userId]
      );
      
      // Pour chaque pharmacie
      for (const pharmacyRow of pharmacyIdsResult.rows) {
        const pharmacyId = pharmacyRow.id;
        
        // Récupérer les IDs des médicaments de la pharmacie
        const medicineIdsResult = await client.query(
          'SELECT id FROM medicines WHERE pharmacy_id = $1',
          [pharmacyId]
        );
        
        // Pour chaque médicament, vérifier s'il est utilisé dans des commandes
        for (const medicineRow of medicineIdsResult.rows) {
          // Supprimer les références dans order_items
          await client.query('DELETE FROM order_items WHERE medicine_id = $1', [medicineRow.id]);
        }
        
        // Maintenant on peut supprimer tous les médicaments de la pharmacie
        await client.query('DELETE FROM medicines WHERE pharmacy_id = $1', [pharmacyId]);
        
        // Supprimer les horaires d'ouverture
        await client.query('DELETE FROM opening_hours WHERE pharmacy_id = $1', [pharmacyId]);
        
        // Récupérer les commandes liées à cette pharmacie
        const orderIdsResult = await client.query(
          'SELECT id FROM orders WHERE pharmacy_id = $1',
          [pharmacyId]
        );
        
        // Supprimer les notifications liées à ces commandes
        for (const orderRow of orderIdsResult.rows) {
          await client.query('DELETE FROM notifications WHERE order_id = $1', [orderRow.id]);
        }
        
        // Pour chaque commande, supprimer les articles et le suivi
        for (const orderRow of orderIdsResult.rows) {
          await client.query('DELETE FROM order_items WHERE order_id = $1', [orderRow.id]);
          await client.query('DELETE FROM tracking_updates WHERE order_id = $1', [orderRow.id]);
        }
        
        // Supprimer les commandes de la pharmacie
        await client.query('DELETE FROM orders WHERE pharmacy_id = $1', [pharmacyId]);
      }
      
      // Supprimer les pharmacies
      await client.query('DELETE FROM pharmacies WHERE owner_id = $1', [userId]);
    }
    
    // Si c'est un livreur, gérer les commandes en cours
    if (user.role === 'driver') {
      // Récupérer les commandes liées à ce livreur
      const orderIdsResult = await client.query(
        'SELECT id FROM orders WHERE driver_id = $1',
        [userId]
      );
      
      // Supprimer les notifications liées à ces commandes
      for (const orderRow of orderIdsResult.rows) {
        await client.query('DELETE FROM notifications WHERE order_id = $1', [orderRow.id]);
      }
      
      // Mettre à null le driver_id dans les commandes
      await client.query('UPDATE orders SET driver_id = NULL WHERE driver_id = $1', [userId]);
      
      // Supprimer la localisation du livreur
      await client.query('DELETE FROM driver_locations WHERE driver_id = $1', [userId]);
    }
    
    // Supprimer les notifications de l'utilisateur
    await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    
    // Supprimer les messages de chat
    await client.query('DELETE FROM chat_messages WHERE sender_id = $1 OR recipient_id = $1', [userId]);
    
    // Supprimer les profils associés
    await client.query('DELETE FROM pharmacist_profiles WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM driver_profiles WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_avatars WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM addresses WHERE user_id = $1', [userId]);

    // Supprimer l'utilisateur
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    // Envoyer un email de notification
    await sendEmail({
      to: user.email,
      subject: 'Demande de compte rejetée - PharmaDelivery',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #CC0000;">Demande de compte rejetée</h2>
          <p>Bonjour ${user.first_name} ${user.last_name},</p>
          <p>Nous regrettons de vous informer que votre demande de compte ${user.role === 'pharmacist' ? 'pharmacien' : 'livreur'} a été rejetée.</p>
          ${reason ? `<p><strong>Raison:</strong> ${reason}</p>` : ''}
          <p>Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter.</p>
          <p>Cordialement,<br>L'équipe PharmaDelivery</p>
        </div>
      `
    });

    res.json({ message: 'Utilisateur rejeté avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur de rejet de l\'utilisateur:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  } finally {
    client.release();
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    
    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active, u.is_verified, u.created_at,
             ua.avatar_url,
             pp.license_number as pharmacist_license,
             dp.license_number as driver_license
      FROM users u
      LEFT JOIN user_avatars ua ON u.id = ua.user_id
      LEFT JOIN pharmacist_profiles pp ON u.id = pp.user_id
      LEFT JOIN driver_profiles dp ON u.id = dp.user_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (role && role !== 'all') {
      paramCount++;
      query += ` AND u.role = $${paramCount}`;
      params.push(role);
    }

    if (status && status !== 'all') {
      paramCount++;
      if (status === 'active') {
        query += ` AND u.is_active = $${paramCount}`;
        params.push(true);
      } else if (status === 'pending') {
        query += ` AND u.is_active = $${paramCount}`;
        params.push(false);
      }
    }

    query += ' ORDER BY u.created_at DESC';

    const result = await pool.query(query, params);

    res.json(result.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      avatarUrl: user.avatar_url,
      hasProfile: !!(user.pharmacist_license || user.driver_license)
    })));
  } catch (error) {
    console.error('Erreur de récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};