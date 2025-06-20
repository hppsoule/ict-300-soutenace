import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Hash password for demo users
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Insert demo users
    const users = [
      {
        email: 'patient@example.com',
        password: hashedPassword,
        first_name: 'Jean',
        last_name: 'Dupont',
        phone: '+33123456789',
        role: 'patient',
        is_verified: true
      },
      {
        email: 'pharmacist@example.com',
        password: hashedPassword,
        first_name: 'Marie',
        last_name: 'Martin',
        phone: '+33987654321',
        role: 'pharmacist',
        is_verified: true
      },
      {
        email: 'driver@example.com',
        password: hashedPassword,
        first_name: 'Pierre',
        last_name: 'Bernard',
        phone: '+33456789123',
        role: 'driver',
        is_verified: true
      },
      {
        email: 'admin@example.com',
        password: hashedPassword,
        first_name: 'Sophie',
        last_name: 'Admin',
        phone: '+33789123456',
        role: 'admin',
        is_verified: true
      }
    ];

    for (const user of users) {
      await pool.query(`
        INSERT INTO users (email, password, first_name, last_name, phone, role, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO NOTHING
      `, [user.email, user.password, user.first_name, user.last_name, user.phone, user.role, user.is_verified]);
    }

    // Get pharmacist user ID
    const pharmacistResult = await pool.query('SELECT id FROM users WHERE email = $1', ['pharmacist@example.com']);
    const pharmacistId = pharmacistResult.rows[0]?.id;

    if (pharmacistId) {
      // Insert demo pharmacy
      const pharmacyResult = await pool.query(`
        INSERT INTO pharmacies (name, owner_id, street, city, postal_code, country, latitude, longitude, phone, email, is_approved)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        'Pharmacie du Centre',
        pharmacistId,
        '45 Avenue des Champs-Élysées',
        'Paris',
        '75008',
        'France',
        48.8698,
        2.3080,
        '+33144567890',
        'contact@pharmaciecentre.fr',
        true
      ]);

      const pharmacyId = pharmacyResult.rows[0]?.id;

      if (pharmacyId) {
        // Insert opening hours
        const openingHours = [
          { day: 1, open: '08:00', close: '20:00' }, // Monday
          { day: 2, open: '08:00', close: '20:00' }, // Tuesday
          { day: 3, open: '08:00', close: '20:00' }, // Wednesday
          { day: 4, open: '08:00', close: '20:00' }, // Thursday
          { day: 5, open: '08:00', close: '20:00' }, // Friday
          { day: 6, open: '09:00', close: '19:00' }, // Saturday
          { day: 0, open: '10:00', close: '18:00' }  // Sunday
        ];

        for (const hours of openingHours) {
          await pool.query(`
            INSERT INTO opening_hours (pharmacy_id, day_of_week, open_time, close_time)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
          `, [pharmacyId, hours.day, hours.open, hours.close]);
        }

        // Insert medicine categories
        const categories = [
          { name: 'Antalgiques', description: 'Médicaments contre la douleur' },
          { name: 'Antibiotiques', description: 'Médicaments contre les infections' },
          { name: 'Antihistaminiques', description: 'Médicaments contre les allergies' },
          { name: 'Respiratoire', description: 'Médicaments pour les voies respiratoires' },
          { name: 'Vitamines', description: 'Compléments vitaminiques' }
        ];

        const categoryIds = {};
        for (const category of categories) {
          const result = await pool.query(`
            INSERT INTO medicine_categories (name, description)
            VALUES ($1, $2)
            ON CONFLICT (name) DO UPDATE SET description = $2
            RETURNING id, name
          `, [category.name, category.description]);
          categoryIds[category.name] = result.rows[0].id;
        }

        // Insert demo medicines
        const medicines = [
          {
            name: 'Doliprane 1000mg',
            description: 'Paracétamol pour douleurs et fièvre',
            price: 3.50,
            category: 'Antalgiques',
            requires_prescription: false,
            quantity: 150
          },
          {
            name: 'Amoxicilline 500mg',
            description: 'Antibiotique à large spectre',
            price: 8.90,
            category: 'Antibiotiques',
            requires_prescription: true,
            quantity: 80
          },
          {
            name: 'Cetirizine 10mg',
            description: 'Antihistaminique pour allergies',
            price: 5.20,
            category: 'Antihistaminiques',
            requires_prescription: false,
            quantity: 200
          },
          {
            name: 'Ventoline',
            description: 'Bronchodilatateur pour asthme',
            price: 12.50,
            category: 'Respiratoire',
            requires_prescription: true,
            quantity: 45
          },
          {
            name: 'Vitamin D3',
            description: 'Complément vitaminique',
            price: 15.80,
            category: 'Vitamines',
            requires_prescription: false,
            quantity: 120
          }
        ];

        for (const medicine of medicines) {
          await pool.query(`
            INSERT INTO medicines (name, description, price, category_id, pharmacy_id, requires_prescription, quantity)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT DO NOTHING
          `, [
            medicine.name,
            medicine.description,
            medicine.price,
            categoryIds[medicine.category],
            pharmacyId,
            medicine.requires_prescription,
            medicine.quantity
          ]);
        }
      }
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
};

seedDatabase();