import fs from "fs";
import mariadb from "mariadb";
import dotenv from "dotenv";

dotenv.config();

async function exportCleanDeploymentSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const url = new URL(databaseUrl);
  const host = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;
  const port = Number(url.port || 3306);
  const user = decodeURIComponent(url.username || "root");
  const password = decodeURIComponent(url.password || "");
  const database = url.pathname.slice(1) || "kollimalai";

  console.log(`Connecting to MySQL database \`${database}\` on ${host}:${port}...`);

  const conn = await mariadb.createConnection({
    host,
    port,
    user,
    password,
    database,
    allowPublicKeyRetrieval: true,
  });

  const outputFile = "kollimalai_clean_deployment.sql";
  let sql = "";

  sql += `-- ========================================================\n`;
  sql += `-- Kollimalai Arasan - Clean Deployment Database Dump\n`;
  sql += `-- Generated on: ${new Date().toISOString()}\n`;
  sql += `-- Database: ${database}\n`;
  sql += `-- Includes: Full schema + Essential seed data (Admin, Customer, Roles, Permissions, Units, Brand)\n`;
  sql += `-- Excludes: Test orders, products, carts, audit logs\n`;
  sql += `-- ========================================================\n\n`;

  sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
  sql += `SET NAMES utf8mb4;\n`;
  sql += `SET time_zone = '+00:00';\n\n`;

  // Get all base tables
  const tablesResult = await conn.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tables = tablesResult.map((row) => Object.values(row)[0]);

  console.log(`Found ${tables.length} tables in database.`);

  // Define which tables to export data for (and query filter if needed)
  const SEED_TABLES = {
    roles: "SELECT * FROM `roles`",
    permissions: "SELECT * FROM `permissions`",
    role_permissions: "SELECT * FROM `role_permissions`",
    users: "SELECT * FROM `users` WHERE `email` IN ('admin@kollimalaiarasan.com', 'customer@kollimalaiarasan.com')",
    product_brands: "SELECT * FROM `product_brands` WHERE `slug` = 'kollimalai-arasan'",
    product_units: "SELECT * FROM `product_units`",
    banner_positions: "SELECT * FROM `banner_positions`",
  };

  for (const table of tables) {
    console.log(`Exporting table structure: ${table}`);
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for \`${table}\`\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;

    const createResult = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    const createTableStmt = createResult[0]["Create Table"];
    sql += `${createTableStmt};\n\n`;

    // Check if this table has seed data
    if (SEED_TABLES[table]) {
      const dataQuery = SEED_TABLES[table];
      const rows = await conn.query(dataQuery);

      if (rows && rows.length > 0) {
        console.log(`  -> Exporting ${rows.length} seed row(s) for ${table}`);
        sql += `-- Seed data for \`${table}\`\n`;

        const columns = Object.keys(rows[0]);
        const colList = columns.map((c) => `\`${c}\``).join(", ");

        const valueRows = rows.map((row) => {
          const vals = columns.map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "boolean") return val ? 1 : 0;
            if (typeof val === "number" || typeof val === "bigint") return val.toString();
            if (val instanceof Date) {
              return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
            }
            if (typeof val === "object") {
              return `'${JSON.stringify(val).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
            }
            return `'${String(val).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
          });
          return `(${vals.join(", ")})`;
        });

        sql += `INSERT INTO \`${table}\` (${colList}) VALUES\n${valueRows.join(",\n")};\n\n`;
      }
    }
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

  fs.writeFileSync(outputFile, sql, "utf8");
  await conn.end();

  const stats = fs.statSync(outputFile);
  const sizeKb = (stats.size / 1024).toFixed(1);

  console.log(`\n✅ Successfully generated clean deployment SQL file:`);
  console.log(`   File: ${outputFile} (${sizeKb} KB)`);
  console.log(`   Admin: admin@kollimalaiarasan.com / admin123`);
  console.log(`   Customer: customer@kollimalaiarasan.com / customer123`);
}

exportCleanDeploymentSql().catch((err) => {
  console.error("Export Error:", err);
  process.exit(1);
});
