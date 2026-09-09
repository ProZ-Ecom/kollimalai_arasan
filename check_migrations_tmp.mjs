import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const databaseUrl = process.env.DATABASE_URL || "mysql://root:root@localhost:3306/rithusnack_new";
const url = new URL(databaseUrl);
const adapter = new PrismaMariaDb({
  host: url.hostname === "localhost" ? "127.0.0.1" : url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  connectionLimit: 10,
  allowPublicKeyRetrieval: true,
});
const db = new PrismaClient({ adapter });

const migrations = await db.$queryRawUnsafe(`SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at`);
console.log(migrations);

const tables = await db.$queryRawUnsafe(`SHOW TABLES LIKE 'otp_verifications'`);
console.log("otp_verifications table exists:", tables);

const cols = await db.$queryRawUnsafe(`SHOW COLUMNS FROM products WHERE Field IN ('is_featured','veg_type')`);
console.log("products cols:", cols);

await db.$disconnect();
