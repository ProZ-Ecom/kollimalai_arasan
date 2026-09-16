const mariadb = require('mariadb');
require('dotenv').config();

async function run() {
  const url = new URL(process.env.DATABASE_URL);
  const conn = await mariadb.createConnection({
    host: url.hostname || 'localhost',
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || 'root'),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.slice(1) || 'kollimalai',
    allowPublicKeyRetrieval: true,
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`payment_redirect_tokens\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`token\` VARCHAR(64) NOT NULL,
      \`razorpay_order_id\` VARCHAR(100) NOT NULL,
      \`internal_order_ref\` VARCHAR(100) NOT NULL,
      \`shipping_address_id\` VARCHAR(100) NOT NULL,
      \`billing_address_id\` VARCHAR(100) DEFAULT NULL,
      \`notes\` TEXT DEFAULT NULL,
      \`amount\` DECIMAL(12,2) NOT NULL,
      \`currency\` VARCHAR(10) NOT NULL DEFAULT 'INR',
      \`order_number\` VARCHAR(100) DEFAULT NULL,
      \`key_id\` VARCHAR(100) NOT NULL,
      \`user_id\` BIGINT UNSIGNED NOT NULL,
      \`is_used\` TINYINT(1) NOT NULL DEFAULT 0,
      \`expires_at\` DATETIME NOT NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_token\` (\`token\`),
      INDEX \`idx_token_exp\` (\`token\`, \`expires_at\`, \`is_used\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Table payment_redirect_tokens created/verified OK.');
  await conn.end();
}

run().catch(console.error);
