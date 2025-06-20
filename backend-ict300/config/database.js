import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Validation des variables d'environnement
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:', missingVars);
  console.error('📝 Créez un fichier .env avec les variables suivantes:');
  console.error('DB_HOST=localhost');
  console.error('DB_PORT=5432');
  console.error('DB_NAME=pharma_delivery');
  console.error('DB_USER=postgres');
  console.error('DB_PASSWORD=votre_mot_de_passe');
  process.exit(1);
}

// Configuration de la pool avec validation
const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD), // S'assurer que c'est une string
  max: 20, // Nombre maximum de connexions
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

console.log('🔧 Configuration de la base de données:');
console.log(`   Host: ${poolConfig.host}`);
console.log(`   Port: ${poolConfig.port}`);
console.log(`   Database: ${poolConfig.database}`);
console.log(`   User: ${poolConfig.user}`);
console.log(`   Password: ${poolConfig.password ? '[CONFIGURÉ]' : '[MANQUANT]'}`);

const pool = new Pool(poolConfig);

// Test de connexion avec gestion d'erreurs améliorée
pool.on('connect', (client) => {
  console.log('✅ Nouvelle connexion PostgreSQL établie');
});

pool.on('error', (err, client) => {
  console.error('❌ Erreur de connexion PostgreSQL:', err.message);
  
  // Messages d'erreur spécifiques
  if (err.code === 'ECONNREFUSED') {
    console.error('🔧 Solution: Vérifiez que PostgreSQL est démarré');
    console.error('   - Windows: Démarrez le service PostgreSQL');
    console.error('   - macOS: brew services start postgresql');
    console.error('   - Linux: sudo systemctl start postgresql');
  } else if (err.code === '28P01') {
    console.error('🔧 Solution: Vérifiez le mot de passe dans le fichier .env');
  } else if (err.code === '3D000') {
    console.error('🔧 Solution: Créez la base de données "pharma_delivery"');
  }
});

// Fonction de test de connexion
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Test de connexion réussi');
    console.log(`📅 Heure serveur: ${result.rows[0].current_time}`);
    console.log(`🐘 Version PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Test de connexion échoué:', error.message);
    return false;
  }
};

export default pool;