import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
const url = new URL(process.env.DATABASE_URL || "mysql://root:root@localhost:3306/rithusnack_new");
const adapter = new PrismaMariaDb({ host: "127.0.0.1", port: Number(url.port||3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1), connectionLimit: 5, allowPublicKeyRetrieval: true });
const db = new PrismaClient({ adapter });

await db.$executeRawUnsafe(`
  INSERT INTO variant_unit_prices (uuid, variant_id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at, created_by, updated_by)
  SELECT UUID(), id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at, created_by, updated_by
  FROM product_variants
`);
console.log("backfilled variant_unit_prices");

const rows = await db.$queryRawUnsafe(`SELECT * FROM variant_unit_prices`);
console.log(rows);

await db.$disconnect();
