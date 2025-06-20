/*
  # Enhanced User Profiles for Pharmacists and Drivers

  1. New Tables
    - `pharmacist_profiles` - Informations spécifiques aux pharmaciens
    - `driver_profiles` - Informations spécifiques aux livreurs
    - `user_avatars` - Gestion des photos de profil

  2. Modifications
    - Ajout de champs spécifiques pour chaque rôle
    - Système de gestion d'avatars

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Table des profils pharmaciens
CREATE TABLE IF NOT EXISTS pharmacist_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    pharmacy_degree VARCHAR(255),
    specialization VARCHAR(255),
    years_experience INTEGER DEFAULT 0,
    professional_order_number VARCHAR(100),
    diploma_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des profils livreurs
CREATE TABLE IF NOT EXISTS driver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    license_type VARCHAR(50) NOT NULL, -- 'B', 'A', 'C', etc.
    license_expiry_date DATE NOT NULL,
    vehicle_type VARCHAR(100), -- 'moto', 'voiture', 'vélo', etc.
    vehicle_registration VARCHAR(50),
    insurance_number VARCHAR(100),
    insurance_expiry_date DATE,
    license_scan_url TEXT,
    insurance_scan_url TEXT,
    background_check_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des avatars utilisateurs
CREATE TABLE IF NOT EXISTS user_avatars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    avatar_url TEXT NOT NULL,
    original_filename VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activer RLS sur les nouvelles tables
ALTER TABLE pharmacist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_avatars ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour pharmacist_profiles
CREATE POLICY "Pharmacists can read own profile"
    ON pharmacist_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Pharmacists can update own profile"
    ON pharmacist_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all pharmacist profiles"
    ON pharmacist_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Politiques RLS pour driver_profiles
CREATE POLICY "Drivers can read own profile"
    ON driver_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update own profile"
    ON driver_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all driver profiles"
    ON driver_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Politiques RLS pour user_avatars
CREATE POLICY "Users can read own avatar"
    ON user_avatars
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar"
    ON user_avatars
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar"
    ON user_avatars
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_pharmacist_profiles_user_id ON pharmacist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacist_profiles_license ON pharmacist_profiles(license_number);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_license ON driver_profiles(license_number);
CREATE INDEX IF NOT EXISTS idx_user_avatars_user_id ON user_avatars(user_id);

-- Insérer des profils de démonstration pour les utilisateurs existants
INSERT INTO pharmacist_profiles (user_id, license_number, pharmacy_degree, specialization, years_experience, professional_order_number)
SELECT 
    u.id,
    'PHARM-' || SUBSTRING(u.id::text, 1, 8),
    'Docteur en Pharmacie',
    'Pharmacie Clinique',
    5,
    'ORD-' || SUBSTRING(u.id::text, 1, 6)
FROM users u 
WHERE u.role = 'pharmacist' AND u.email IN ('pharmacist@example.com', 'pharmacist2@example.com')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO driver_profiles (user_id, license_number, license_type, license_expiry_date, vehicle_type, vehicle_registration, insurance_number, insurance_expiry_date, background_check_status)
SELECT 
    u.id,
    'LIC-' || SUBSTRING(u.id::text, 1, 8),
    'B',
    CURRENT_DATE + INTERVAL '2 years',
    'moto',
    'AB-123-CD',
    'INS-' || SUBSTRING(u.id::text, 1, 8),
    CURRENT_DATE + INTERVAL '1 year',
    'approved'
FROM users u 
WHERE u.role = 'driver' AND u.email IN ('driver@example.com', 'driver2@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Afficher un message de confirmation
SELECT 'Profils utilisateurs améliorés créés avec succès!' as message;