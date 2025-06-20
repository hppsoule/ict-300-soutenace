-- Script pour supprimer les utilisateurs spécifiés
-- Exécutez ce script dans pgAdmin ou via psql

-- Désactiver temporairement les contraintes de clé étrangère pour faciliter la suppression
SET session_replication_role = 'replica';

-- Supprimer les utilisateurs par email
DELETE FROM users WHERE email IN (
    'abadjacko@gmail.com',
    'fatoumafotor@gmail.com',
    'admin@mavoily.com',
    'soule@gmail.com',
    'djackosoulemane@gmail.com'
);

-- Réactiver les contraintes de clé étrangère
SET session_replication_role = 'origin';

-- Vérifier que les utilisateurs ont bien été supprimés
SELECT email, first_name, last_name, role FROM users 
WHERE email IN (
    'abadjacko@gmail.com',
    'fatoumafotor@gmail.com',
    'admin@mavoily.com',
    'soule@gmail.com',
    'djackosoulemane@gmail.com'
);

-- Afficher les utilisateurs restants
SELECT email, first_name, last_name, role FROM users;