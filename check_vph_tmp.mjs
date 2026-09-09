import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
const url = new URL(process.env.DATABASE_URL || "mysql://root:root@localhost:3306/rithusnack_new");
const adapter = new PrismaMariaDb({ host: "127.0.0.1", port: Number(url.port||3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1), connectionLimit: 5, allowPublicKeyRetrieval: true });
const db = new PrismaClient({ adapter });
console.log(await db.$queryRawUnsafe(`SHOW COLUMNS FROM variant_price_history`));
await db.$disconnect();
