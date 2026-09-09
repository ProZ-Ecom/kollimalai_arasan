import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
const url = new URL(process.env.DATABASE_URL || "mysql://root:root@localhost:3306/rithusnack_new");
const adapter = new PrismaMariaDb({ host: "127.0.0.1", port: Number(url.port||3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1), connectionLimit: 5, allowPublicKeyRetrieval: true });
const db = new PrismaClient({ adapter });

async function cols(table) {
  const rows = await db.$queryRawUnsafe(`SHOW COLUMNS FROM \`${table}\``);
  return rows.map(r => r.Field);
}
async function fks(table) {
  const rows = await db.$queryRawUnsafe(`
    SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`, table);
  return rows.map(r => r.CONSTRAINT_NAME);
}
async function idxs(table) {
  const rows = await db.$queryRawUnsafe(`SHOW INDEX FROM \`${table}\``);
  return [...new Set(rows.map(r => r.Key_name))];
}

console.log("variant_unit_prices rows:", await db.$queryRawUnsafe(`SELECT * FROM variant_unit_prices`));
console.log("product_variants cols:", await cols('product_variants'));
console.log("inventories cols:", await cols('inventories'));
console.log("inventory_transactions cols:", await cols('inventory_transactions'));
console.log("variant_price_history cols:", await cols('variant_price_history'));

console.log("product_variants fks:", await fks('product_variants'));
console.log("inventories fks:", await fks('inventories'));
console.log("inventory_transactions fks:", await fks('inventory_transactions'));
console.log("variant_price_history fks:", await fks('variant_price_history'));
console.log("variant_unit_prices fks:", await fks('variant_unit_prices'));

console.log("product_variants idx:", await idxs('product_variants'));
console.log("inventories idx:", await idxs('inventories'));
console.log("inventory_transactions idx:", await idxs('inventory_transactions'));
console.log("variant_price_history idx:", await idxs('variant_price_history'));

await db.$disconnect();
