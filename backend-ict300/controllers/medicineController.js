import pool from '../config/database.js';

export const getMedicines = async (req, res) => {
  try {
    const { pharmacyId, category, search, requiresPrescription } = req.query;
    
    let query = `
      SELECT m.*, mc.name as category_name, p.name as pharmacy_name
      FROM medicines m
      LEFT JOIN medicine_categories mc ON m.category_id = mc.id
      LEFT JOIN pharmacies p ON m.pharmacy_id = p.id
      WHERE m.in_stock = true AND m.quantity >= 0
    `;
    
    const params = [];
    let paramCount = 0;

    if (pharmacyId) {
      paramCount++;
      query += ` AND m.pharmacy_id = $${paramCount}`;
      params.push(pharmacyId);
    }

    if (category) {
      paramCount++;
      query += ` AND mc.name ILIKE $${paramCount}`;
      params.push(`%${category}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (m.name ILIKE $${paramCount} OR m.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (requiresPrescription !== undefined) {
      paramCount++;
      query += ` AND m.requires_prescription = $${paramCount}`;
      params.push(requiresPrescription === 'true');
    }

    query += ' ORDER BY m.name';

    const result = await pool.query(query, params);

    const medicines = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      category: row.category_name,
      categoryId: row.category_id,
      pharmacyId: row.pharmacy_id,
      pharmacyName: row.pharmacy_name,
      requiresPrescription: row.requires_prescription,
      inStock: row.in_stock,
      quantity: row.quantity,
      imageUrl: row.image_url,
      barcode: row.barcode,
      manufacturer: row.manufacturer,
      expiryDate: row.expiry_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(medicines);
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const { medicineId } = req.params;

    const result = await pool.query(`
      SELECT m.*, mc.name as category_name, p.name as pharmacy_name, p.phone as pharmacy_phone
      FROM medicines m
      LEFT JOIN medicine_categories mc ON m.category_id = mc.id
      LEFT JOIN pharmacies p ON m.pharmacy_id = p.id
      WHERE m.id = $1
    `, [medicineId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Médicament non trouvé' });
    }

    const medicine = result.rows[0];

    res.json({
      id: medicine.id,
      name: medicine.name,
      description: medicine.description,
      price: parseFloat(medicine.price),
      category: medicine.category_name,
      categoryId: medicine.category_id,
      pharmacyId: medicine.pharmacy_id,
      pharmacyName: medicine.pharmacy_name,
      pharmacyPhone: medicine.pharmacy_phone,
      requiresPrescription: medicine.requires_prescription,
      inStock: medicine.in_stock,
      quantity: medicine.quantity,
      imageUrl: medicine.image_url,
      barcode: medicine.barcode,
      manufacturer: medicine.manufacturer,
      expiryDate: medicine.expiry_date,
      createdAt: medicine.created_at,
      updatedAt: medicine.updated_at
    });
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const { name, description, price, categoryId, requiresPrescription, quantity, manufacturer, expiryDate, barcode, imageUrl } = req.body;
    const userId = req.user.id;

    // Récupérer la pharmacie de l'utilisateur
    const pharmacyResult = await pool.query(
      'SELECT id FROM pharmacies WHERE owner_id = $1 AND is_approved = true',
      [userId]
    );

    if (pharmacyResult.rows.length === 0) {
      // Si aucune pharmacie n'existe, créer une pharmacie par défaut pour cet utilisateur
      console.log(`Création d'une pharmacie par défaut pour l'utilisateur ${userId}`);
      
      // Récupérer les informations de l'utilisateur
      const userResult = await pool.query(
        'SELECT first_name, last_name, email, phone FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      const user = userResult.rows[0];
      
      // Créer une pharmacie par défaut
      const newPharmacyResult = await pool.query(`
        INSERT INTO pharmacies (name, owner_id, street, city, postal_code, country, phone, email, is_approved)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        `Pharmacie de ${user.first_name} ${user.last_name}`,
        userId,
        '123 Rue de la Pharmacie',
        'Paris',
        '75001',
        'France',
        user.phone || '+33123456789',
        user.email,
        true // Approuvée automatiquement
      ]);
      
      const pharmacyId = newPharmacyResult.rows[0].id;
      console.log(`Pharmacie créée avec l'ID: ${pharmacyId}`);
    }

    // Récupérer à nouveau la pharmacie (soit existante, soit nouvellement créée)
    const finalPharmacyResult = await pool.query(
      'SELECT id FROM pharmacies WHERE owner_id = $1 AND is_approved = true',
      [userId]
    );

    const pharmacyId = finalPharmacyResult.rows[0].id;

    // Vérifier si un médicament avec le même nom existe déjà dans cette pharmacie
    const existingMedicine = await pool.query(
      'SELECT id FROM medicines WHERE name = $1 AND pharmacy_id = $2',
      [name, pharmacyId]
    );

    if (existingMedicine.rows.length > 0) {
      return res.status(400).json({ error: 'Un médicament avec ce nom existe déjà dans votre pharmacie' });
    }

    const result = await pool.query(`
      INSERT INTO medicines (name, description, price, category_id, pharmacy_id, requires_prescription, quantity, manufacturer, expiry_date, barcode, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [name, description, price, categoryId, pharmacyId, requiresPrescription, quantity, manufacturer, expiryDate, barcode, imageUrl]);

    const medicine = result.rows[0];

    res.status(201).json({
      message: 'Médicament créé avec succès',
      medicine: {
        id: medicine.id,
        name: medicine.name,
        description: medicine.description,
        price: parseFloat(medicine.price),
        categoryId: medicine.category_id,
        pharmacyId: medicine.pharmacy_id,
        requiresPrescription: medicine.requires_prescription,
        inStock: medicine.in_stock,
        quantity: medicine.quantity,
        manufacturer: medicine.manufacturer,
        expiryDate: medicine.expiry_date,
        barcode: medicine.barcode,
        imageUrl: medicine.image_url,
        createdAt: medicine.created_at
      }
    });
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { name, description, price, categoryId, requiresPrescription, quantity, manufacturer, expiryDate, barcode, imageUrl } = req.body;
    const userId = req.user.id;

    // Vérifier si l'utilisateur possède la pharmacie
    const medicineResult = await pool.query(`
      SELECT m.*, p.owner_id
      FROM medicines m
      JOIN pharmacies p ON m.pharmacy_id = p.id
      WHERE m.id = $1
    `, [medicineId]);

    if (medicineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Médicament non trouvé' });
    }

    if (medicineResult.rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const result = await pool.query(`
      UPDATE medicines 
      SET name = $1, description = $2, price = $3, category_id = $4, requires_prescription = $5, 
          quantity = $6, manufacturer = $7, expiry_date = $8, barcode = $9, image_url = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [name, description, price, categoryId, requiresPrescription, quantity, manufacturer, expiryDate, barcode, imageUrl, medicineId]);

    const medicine = result.rows[0];

    res.json({
      message: 'Médicament modifié avec succès',
      medicine: {
        id: medicine.id,
        name: medicine.name,
        description: medicine.description,
        price: parseFloat(medicine.price),
        categoryId: medicine.category_id,
        pharmacyId: medicine.pharmacy_id,
        requiresPrescription: medicine.requires_prescription,
        inStock: medicine.in_stock,
        quantity: medicine.quantity,
        manufacturer: medicine.manufacturer,
        expiryDate: medicine.expiry_date,
        barcode: medicine.barcode,
        imageUrl: medicine.image_url,
        updatedAt: medicine.updated_at
      }
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const userId = req.user.id;

    // Vérifier si l'utilisateur possède la pharmacie
    const medicineResult = await pool.query(`
      SELECT m.*, p.owner_id
      FROM medicines m
      JOIN pharmacies p ON m.pharmacy_id = p.id
      WHERE m.id = $1
    `, [medicineId]);

    if (medicineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Médicament non trouvé' });
    }

    if (medicineResult.rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier s'il y a des commandes en cours avec ce médicament
    const activeOrdersResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.medicine_id = $1 AND o.status IN ('pending', 'validated', 'preparing', 'ready', 'in_transit')
    `, [medicineId]);

    if (parseInt(activeOrdersResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer ce médicament car il fait partie de commandes en cours' 
      });
    }

    await pool.query('DELETE FROM medicines WHERE id = $1', [medicineId]);

    res.json({ message: 'Médicament supprimé avec succès' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicine_categories ORDER BY name');
    
    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at
    }));

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const updateMedicineStock = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'
    const userId = req.user.id;

    // Vérifier si l'utilisateur possède la pharmacie
    const medicineResult = await pool.query(`
      SELECT m.*, p.owner_id
      FROM medicines m
      JOIN pharmacies p ON m.pharmacy_id = p.id
      WHERE m.id = $1
    `, [medicineId]);

    if (medicineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Médicament non trouvé' });
    }

    if (medicineResult.rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    let newQuantity;
    const currentQuantity = medicineResult.rows[0].quantity;

    switch (operation) {
      case 'add':
        newQuantity = currentQuantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, currentQuantity - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        break;
      default:
        return res.status(400).json({ error: 'Opération invalide' });
    }

    const result = await pool.query(`
      UPDATE medicines 
      SET quantity = $1, in_stock = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [newQuantity, newQuantity > 0, medicineId]);

    const medicine = result.rows[0];

    res.json({
      message: 'Stock mis à jour avec succès',
      medicine: {
        id: medicine.id,
        quantity: medicine.quantity,
        inStock: medicine.in_stock,
        updatedAt: medicine.updated_at
      }
    });
  } catch (error) {
    console.error('Update medicine stock error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Nouvelle fonction pour obtenir les médicaments d'un pharmacien spécifique
export const getPharmacistMedicines = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, search } = req.query;

    // Récupérer la pharmacie de l'utilisateur
    const pharmacyResult = await pool.query(
      'SELECT id FROM pharmacies WHERE owner_id = $1 AND is_approved = true',
      [userId]
    );

    if (pharmacyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Aucune pharmacie trouvée pour cet utilisateur' });
    }

    const pharmacyId = pharmacyResult.rows[0].id;

    let query = `
      SELECT m.*, mc.name as category_name, p.name as pharmacy_name
      FROM medicines m
      LEFT JOIN medicine_categories mc ON m.category_id = mc.id
      LEFT JOIN pharmacies p ON m.pharmacy_id = p.id
      WHERE m.pharmacy_id = $1
    `;
    
    const params = [pharmacyId];
    let paramCount = 1;

    if (category) {
      paramCount++;
      query += ` AND mc.name ILIKE $${paramCount}`;
      params.push(`%${category}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (m.name ILIKE $${paramCount} OR m.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY m.name';

    const result = await pool.query(query, params);

    const medicines = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      category: row.category_name,
      categoryId: row.category_id,
      pharmacyId: row.pharmacy_id,
      pharmacyName: row.pharmacy_name,
      requiresPrescription: row.requires_prescription,
      inStock: row.in_stock,
      quantity: row.quantity,
      imageUrl: row.image_url,
      barcode: row.barcode,
      manufacturer: row.manufacturer,
      expiryDate: row.expiry_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(medicines);
  } catch (error) {
    console.error('Get pharmacist medicines error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};