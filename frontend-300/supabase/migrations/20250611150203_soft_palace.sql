-- Script SQL complet pour la base de données PharmaDelivery
-- À exécuter dans pgAdmin pour créer toute la structure

-- Créer la base de données (optionnel si elle n'existe pas déjà)
-- CREATE DATABASE pharma_delivery;

-- Se connecter à la base de données
-- \c pharma_delivery;

-- Activer l'extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('patient', 'pharmacist', 'driver', 'admin')) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    reset_password_token TEXT,
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des adresses
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des pharmacies
CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_open BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2) DEFAULT 0,
    image_url TEXT,
    license_number VARCHAR(100),
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des horaires d'ouverture
CREATE TABLE IF NOT EXISTS opening_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false
);

-- Table des catégories de médicaments
CREATE TABLE IF NOT EXISTS medicine_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des médicaments
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id UUID REFERENCES medicine_categories(id),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    requires_prescription BOOLEAN DEFAULT false,
    in_stock BOOLEAN DEFAULT true,
    quantity INTEGER DEFAULT 0,
    image_url TEXT,
    barcode VARCHAR(100),
    manufacturer VARCHAR(255),
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users(id),
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'validated', 'rejected', 'paid', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'pending',
    prescription_url TEXT,
    rejection_reason TEXT,
    delivery_street VARCHAR(255) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_postal_code VARCHAR(20) NOT NULL,
    delivery_country VARCHAR(100) NOT NULL,
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    estimated_delivery TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des articles de commande
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des mises à jour de suivi
CREATE TABLE IF NOT EXISTS tracking_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des messages de chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    order_id UUID REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des localisations des livreurs (pour le suivi en temps réel)
CREATE TABLE IF NOT EXISTS driver_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_orders_patient_id ON orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_id ON orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_medicines_pharmacy_id ON medicines(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_medicines_category_id ON medicines(category_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_order_id ON chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_updates_order_id ON tracking_updates(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Insérer les données de démonstration

-- Insérer les catégories de médicaments
INSERT INTO medicine_categories (name, description) VALUES
('Antalgiques', 'Médicaments contre la douleur'),
('Antibiotiques', 'Médicaments contre les infections'),
('Antihistaminiques', 'Médicaments contre les allergies'),
('Respiratoire', 'Médicaments pour les voies respiratoires'),
('Vitamines', 'Compléments vitaminiques'),
('Cardiovasculaire', 'Médicaments pour le cœur et la circulation'),
('Digestif', 'Médicaments pour les troubles digestifs'),
('Dermatologie', 'Médicaments pour la peau')
ON CONFLICT (name) DO NOTHING;

-- Insérer les utilisateurs de démonstration (mot de passe: 123456 hashé avec bcrypt)
INSERT INTO users (email, password, first_name, last_name, phone, role, is_verified, is_active) VALUES
('patient@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa', 'Jean', 'Dupont', '+33123456789', 'patient', true, true),
('pharmacist@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa', 'Marie', 'Martin', '+33987654321', 'pharmacist', true, true),
('driver@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa', 'Pierre', 'Bernard', '+33456789123', 'driver', true, true),
('admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa', 'Sophie', 'Admin', '+33789123456', 'admin', true, true),
('pharmacist2@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa', 'Paul', 'Pharmacien', '+33555666777', 'pharmacist', true, true),
('driver2@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa', 'Luc', 'Livreur', '+33444555666', 'driver', true, true)
ON CONFLICT (email) DO NOTHING;

-- Insérer les pharmacies
INSERT INTO pharmacies (name, owner_id, street, city, postal_code, country, latitude, longitude, phone, email, is_approved, is_open) 
SELECT 
    'Pharmacie du Centre',
    u.id,
    '45 Avenue des Champs-Élysées',
    'Paris',
    '75008',
    'France',
    48.8698,
    2.3080,
    '+33144567890',
    'contact@pharmaciecentre.fr',
    true,
    true
FROM users u WHERE u.email = 'pharmacist@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO pharmacies (name, owner_id, street, city, postal_code, country, latitude, longitude, phone, email, is_approved, is_open) 
SELECT 
    'Pharmacie de la Santé',
    u.id,
    '123 Rue de Rivoli',
    'Paris',
    '75001',
    'France',
    48.8606,
    2.3376,
    '+33155667788',
    'contact@pharmaciesante.fr',
    true,
    true
FROM users u WHERE u.email = 'pharmacist2@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO opening_hours (pharmacy_id, day_of_week, open_time, close_time)
SELECT 
    p.id, 
    1, 
    CAST('08:00' AS TIME), 
    CAST('20:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie du Centre'
UNION ALL
SELECT 
    p.id, 
    2, 
    CAST('08:00' AS TIME), 
    CAST('20:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie du Centre'
UNION ALL
SELECT 
    p.id, 
    3, 
    CAST('08:00' AS TIME), 
    CAST('20:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie du Centre'
UNION ALL
SELECT 
    p.id, 
    4, 
    CAST('08:00' AS TIME), 
    CAST('20:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie du Centre'
UNION ALL
SELECT 
    p.id, 
    5, 
    CAST('08:00' AS TIME), 
    CAST('20:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie du Centre'
UNION ALL
SELECT 
    p.id, 
    6, 
    CAST('09:00' AS TIME), 
    CAST('19:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie du Centre'
UNION ALL
SELECT 
    p.id, 
    0, 
    CAST('10:00' AS TIME), 
    CAST('18:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie du Centre';

-- Pour la deuxième pharmacie (Pharmacie de la Santé)
INSERT INTO opening_hours (pharmacy_id, day_of_week, open_time, close_time)
SELECT 
    p.id, 
    1, 
    CAST('09:00' AS TIME), 
    CAST('19:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie de la Santé'
UNION ALL
SELECT 
    p.id, 
    2, 
    CAST('09:00' AS TIME), 
    CAST('19:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie de la Santé'
UNION ALL
SELECT 
    p.id, 
    3, 
    CAST('09:00' AS TIME), 
    CAST('19:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie de la Santé'
UNION ALL
SELECT 
    p.id, 
    4, 
    CAST('09:00' AS TIME), 
    CAST('19:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie de la Santé'
UNION ALL
SELECT 
    p.id, 
    5, 
    CAST('09:00' AS TIME), 
    CAST('19:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie de la Santé'
UNION ALL
SELECT 
    p.id, 
    6, 
    CAST('10:00' AS TIME), 
    CAST('18:00' AS TIME) 
FROM pharmacies p WHERE p.name = 'Pharmacie de la Santé';


-- Insérer les médicaments pour la première pharmacie
INSERT INTO medicines (name, description, price, category_id, pharmacy_id, requires_prescription, quantity, manufacturer, barcode)
SELECT 
    'Doliprane 1000mg',
    'Paracétamol pour douleurs et fièvre - Boîte de 8 comprimés',
    3.50,
    mc.id,
    p.id,
    false,
    150,
    'Sanofi',
    '3400930000001'
FROM medicine_categories mc, pharmacies p 
WHERE mc.name = 'Antalgiques' AND p.name = 'Pharmacie du Centre'
ON CONFLICT DO NOTHING;

INSERT INTO medicines (name, description, price, category_id, pharmacy_id, requires_prescription, quantity, manufacturer, barcode)
SELECT 
    'Amoxicilline 500mg',
    'Antibiotique à large spectre - Boîte de 12 gélules',
    8.90,
    mc.id,
    p.id,
    true,
    80,
    'Mylan',
    '3400930000002'
FROM medicine_categories mc, pharmacies p 
WHERE mc.name = 'Antibiotiques' AND p.name = 'Pharmacie du Centre'
ON CONFLICT DO NOTHING;

INSERT INTO medicines (name, description, price, category_id, pharmacy_id, requires_prescription, quantity, manufacturer, barcode)
SELECT 
    'Cetirizine 10mg',
    'Antihistaminique pour allergies - Boîte de 7 comprimés',
    5.20,
    mc.id,
    p.id,
    false,
    200,
    'Biogaran',
    '3400930000003'
FROM medicine_categories mc, pharmacies p 
WHERE mc.name = 'Antihistaminiques' AND p.name = 'Pharmacie du Centre'
ON CONFLICT DO NOTHING;

INSERT INTO medicines (name, description, price, category_id, pharmacy_id, requires_prescription, quantity, manufacturer, barcode)
SELECT 
    'Ventoline 100µg',
    'Bronchodilatateur pour asthme - Aérosol doseur',
    12.50,
    mc.id,
    p.id,
    true,
    45,
    'GSK',
    '3400930000004'
FROM medicine_categories mc, pharmacies p 
WHERE mc.name = 'Respiratoire' AND p.name = 'Pharmacie du Centre'
ON CONFLICT DO NOTHING;

INSERT INTO medicines (name, description, price, category_id, pharmacy_id, requires_prescription, quantity, manufacturer, barcode)
SELECT 
    'Vitamin D3 1000 UI',
    'Complément vitaminique - Boîte de 30 comprimés',
    15.80,
    mc.id,
    p.id,
    false,
    120,
    'Zyma',
    '3400930000005'
FROM medicine_categories mc, pharmacies p 
WHERE mc.name = 'Vitamines' AND p.name = 'Pharmacie du Centre'
ON CONFLICT DO NOTHING;

INSERT INTO medicines (name, description, price, category_id, pharmacy_id, requires_prescription, quantity, manufacturer, barcode)
SELECT 
    'Ibuprofen 400mg',
    'Anti-inflammatoire non stéroïdien - Boîte de 20 comprimés',
    4.20,
    mc.id,
    p.id,
    false,
    90,
    'Advil',
    '3400930000006'
FROM medicine_categories mc, pharmacies p 
WHERE mc.name = 'Antalgiques' AND p.name = 'Pharmacie du Centre'
ON CONFLICT DO NOTHING;

-- Insérer quelques médicaments pour la deuxième pharmacie
INSERT INTO medicines (name, description, price, category_id, pharmacy_id, requires_prescription, quantity, manufacturer, barcode)
SELECT 
    'Aspirin 500mg',
    'Acide acétylsalicylique - Boîte de 20 comprimés',
    2.80,
    mc.id,
    p.id,
    false,
    75,
    'Bayer',
    '3400930000007'
FROM medicine_categories mc, pharmacies p 
WHERE mc.name = 'Antalgiques' AND p.name = 'Pharmacie de la Santé'
ON CONFLICT DO NOTHING;

INSERT INTO medicines (name, description, price, category_id, pharmacy_id, requires_prescription, quantity, manufacturer, barcode)
SELECT 
    'Omeprazole 20mg',
    'Inhibiteur de la pompe à protons - Boîte de 14 gélules',
    6.50,
    mc.id,
    p.id,
    false,
    60,
    'Sandoz',
    '3400930000008'
FROM medicine_categories mc, pharmacies p 
WHERE mc.name = 'Digestif' AND p.name = 'Pharmacie de la Santé'
ON CONFLICT DO NOTHING;

-- Insérer les adresses des utilisateurs
INSERT INTO addresses (user_id, street, city, postal_code, country, latitude, longitude, is_default)
SELECT u.id, '123 Rue de la Santé', 'Paris', '75013', 'France', 48.8566, 2.3522, true
FROM users u WHERE u.email = 'patient@example.com'
ON CONFLICT DO NOTHING;

-- Insérer les localisations des livreurs
INSERT INTO driver_locations (driver_id, latitude, longitude, is_available)
SELECT u.id, 48.8606, 2.3376, true
FROM users u WHERE u.email = 'driver@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO driver_locations (driver_id, latitude, longitude, is_available)
SELECT u.id, 48.8566, 2.3522, true
FROM users u WHERE u.email = 'driver2@example.com'
ON CONFLICT DO NOTHING;

-- Créer une commande d'exemple
INSERT INTO orders (patient_id, pharmacy_id, total, delivery_street, delivery_city, delivery_postal_code, delivery_country, delivery_latitude, delivery_longitude, status)
SELECT 
    u_patient.id,
    p.id,
    7.00,
    '123 Rue de la Santé',
    'Paris',
    '75013',
    'France',
    48.8566,
    2.3522,
    'pending'
FROM users u_patient, pharmacies p
WHERE u_patient.email = 'patient@example.com' AND p.name = 'Pharmacie du Centre'
ON CONFLICT DO NOTHING;

-- Insérer les articles de la commande d'exemple
INSERT INTO order_items (order_id, medicine_id, quantity, price)
SELECT 
    o.id,
    m.id,
    2,
    3.50
FROM orders o, medicines m, users u, pharmacies p
WHERE u.email = 'patient@example.com' 
    AND o.patient_id = u.id 
    AND p.name = 'Pharmacie du Centre'
    AND o.pharmacy_id = p.id
    AND m.name = 'Doliprane 1000mg'
    AND m.pharmacy_id = p.id
ON CONFLICT DO NOTHING;

-- Insérer une mise à jour de suivi pour la commande
INSERT INTO tracking_updates (order_id, status, message)
SELECT o.id, 'pending', 'Commande reçue et en attente de validation'
FROM orders o, users u
WHERE u.email = 'patient@example.com' AND o.patient_id = u.id
ON CONFLICT DO NOTHING;

-- Afficher un message de confirmation
SELECT 'Base de données PharmaDelivery créée avec succès!' as message;

-- Afficher les statistiques
SELECT 
    'Utilisateurs créés: ' || COUNT(*) as statistiques
FROM users
UNION ALL
SELECT 
    'Pharmacies créées: ' || COUNT(*)
FROM pharmacies
UNION ALL
SELECT 
    'Médicaments ajoutés: ' || COUNT(*)
FROM medicines
UNION ALL
SELECT 
    'Catégories créées: ' || COUNT(*)
FROM medicine_categories;