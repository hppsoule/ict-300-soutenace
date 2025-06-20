import pool from '../config/database.js';

export const getPharmacies = async (req, res) => {
  try {
    const { city, isOpen } = req.query;
    
    let query = `
      SELECT p.*, u.first_name, u.last_name, u.phone as owner_phone, u.email as owner_email,
             json_agg(
               json_build_object(
                 'day', oh.day_of_week,
                 'openTime', oh.open_time,
                 'closeTime', oh.close_time,
                 'isClosed', oh.is_closed
               )
             ) as opening_hours
      FROM pharmacies p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN opening_hours oh ON p.id = oh.pharmacy_id
      WHERE p.is_approved = true
    `;
    
    const params = [];
    let paramCount = 0;

    if (city) {
      paramCount++;
      query += ` AND p.city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
    }

    if (isOpen !== undefined) {
      paramCount++;
      query += ` AND p.is_open = $${paramCount}`;
      params.push(isOpen === 'true');
    }

    query += ' GROUP BY p.id, u.first_name, u.last_name, u.phone, u.email ORDER BY p.name';

    const result = await pool.query(query, params);

    const pharmacies = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      ownerName: `${row.first_name} ${row.last_name}`,
      ownerPhone: row.owner_phone,
      ownerEmail: row.owner_email,
      address: {
        street: row.street,
        city: row.city,
        postalCode: row.postal_code,
        country: row.country,
        coordinates: row.latitude && row.longitude ? {
          lat: parseFloat(row.latitude),
          lng: parseFloat(row.longitude)
        } : null
      },
      phone: row.phone,
      email: row.email,
      isOpen: row.is_open,
      rating: parseFloat(row.rating || 0),
      imageUrl: row.image_url,
      licenseNumber: row.license_number,
      isApproved: row.is_approved,
      openingHours: row.opening_hours || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(pharmacies);
  } catch (error) {
    console.error('Get pharmacies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPharmacyById = async (req, res) => {
  try {
    const { pharmacyId } = req.params;

    const result = await pool.query(`
      SELECT p.*, u.first_name, u.last_name, u.phone as owner_phone, u.email as owner_email,
             json_agg(
               json_build_object(
                 'day', oh.day_of_week,
                 'openTime', oh.open_time,
                 'closeTime', oh.close_time,
                 'isClosed', oh.is_closed
               )
             ) as opening_hours
      FROM pharmacies p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN opening_hours oh ON p.id = oh.pharmacy_id
      WHERE p.id = $1
      GROUP BY p.id, u.first_name, u.last_name, u.phone, u.email
    `, [pharmacyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    const pharmacy = result.rows[0];

    res.json({
      id: pharmacy.id,
      name: pharmacy.name,
      ownerId: pharmacy.owner_id,
      ownerName: `${pharmacy.first_name} ${pharmacy.last_name}`,
      ownerPhone: pharmacy.owner_phone,
      ownerEmail: pharmacy.owner_email,
      address: {
        street: pharmacy.street,
        city: pharmacy.city,
        postalCode: pharmacy.postal_code,
        country: pharmacy.country,
        coordinates: pharmacy.latitude && pharmacy.longitude ? {
          lat: parseFloat(pharmacy.latitude),
          lng: parseFloat(pharmacy.longitude)
        } : null
      },
      phone: pharmacy.phone,
      email: pharmacy.email,
      isOpen: pharmacy.is_open,
      rating: parseFloat(pharmacy.rating || 0),
      imageUrl: pharmacy.image_url,
      licenseNumber: pharmacy.license_number,
      isApproved: pharmacy.is_approved,
      openingHours: pharmacy.opening_hours || [],
      createdAt: pharmacy.created_at,
      updatedAt: pharmacy.updated_at
    });
  } catch (error) {
    console.error('Get pharmacy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPharmacy = async (req, res) => {
  try {
    const { name, address, phone, email, licenseNumber, openingHours } = req.body;
    const ownerId = req.user.id;

    // Check if user already has a pharmacy
    const existingPharmacy = await pool.query(
      'SELECT id FROM pharmacies WHERE owner_id = $1',
      [ownerId]
    );

    if (existingPharmacy.rows.length > 0) {
      return res.status(400).json({ error: 'User already has a pharmacy' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create pharmacy
      const pharmacyResult = await client.query(`
        INSERT INTO pharmacies (name, owner_id, street, city, postal_code, country, latitude, longitude, phone, email, license_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        name,
        ownerId,
        address.street,
        address.city,
        address.postalCode,
        address.country,
        address.coordinates?.lat || null,
        address.coordinates?.lng || null,
        phone,
        email,
        licenseNumber
      ]);

      const pharmacyId = pharmacyResult.rows[0].id;

      // Add opening hours
      if (openingHours && openingHours.length > 0) {
        for (const hours of openingHours) {
          await client.query(`
            INSERT INTO opening_hours (pharmacy_id, day_of_week, open_time, close_time, is_closed)
            VALUES ($1, $2, $3, $4, $5)
          `, [pharmacyId, hours.day, hours.openTime, hours.closeTime, hours.isClosed || false]);
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Pharmacy created successfully. Awaiting admin approval.',
        pharmacyId: pharmacyId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create pharmacy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePharmacy = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { name, address, phone, email, isOpen, openingHours } = req.body;
    const userId = req.user.id;

    // Check ownership
    const pharmacyResult = await pool.query(
      'SELECT owner_id FROM pharmacies WHERE id = $1',
      [pharmacyId]
    );

    if (pharmacyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    if (pharmacyResult.rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update pharmacy
      await client.query(`
        UPDATE pharmacies 
        SET name = $1, street = $2, city = $3, postal_code = $4, country = $5, 
            latitude = $6, longitude = $7, phone = $8, email = $9, is_open = $10, updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
      `, [
        name,
        address.street,
        address.city,
        address.postalCode,
        address.country,
        address.coordinates?.lat || null,
        address.coordinates?.lng || null,
        phone,
        email,
        isOpen,
        pharmacyId
      ]);

      // Update opening hours
      if (openingHours) {
        await client.query('DELETE FROM opening_hours WHERE pharmacy_id = $1', [pharmacyId]);
        
        for (const hours of openingHours) {
          await client.query(`
            INSERT INTO opening_hours (pharmacy_id, day_of_week, open_time, close_time, is_closed)
            VALUES ($1, $2, $3, $4, $5)
          `, [pharmacyId, hours.day, hours.openTime, hours.closeTime, hours.isClosed || false]);
        }
      }

      await client.query('COMMIT');

      res.json({ message: 'Pharmacy updated successfully' });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update pharmacy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};