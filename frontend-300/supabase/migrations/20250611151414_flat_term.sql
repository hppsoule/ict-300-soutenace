-- Script de correction pour l'erreur de type TIME
-- Exécutez ce script dans pgAdmin pour corriger le problème

-- Supprimer les données existantes des horaires d'ouverture si elles existent
DELETE FROM opening_hours;

-- Insérer les horaires d'ouverture avec le bon casting de type
-- Pour la première pharmacie (Pharmacie du Centre)
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

-- Vérifier que les données ont été insérées correctement
SELECT 
    p.name as pharmacie,
    oh.day_of_week as jour_semaine,
    oh.open_time as ouverture,
    oh.close_time as fermeture
FROM opening_hours oh
JOIN pharmacies p ON oh.pharmacy_id = p.id
ORDER BY p.name, oh.day_of_week;

-- Afficher un message de confirmation
SELECT 'Horaires d''ouverture corrigés avec succès!' as message;