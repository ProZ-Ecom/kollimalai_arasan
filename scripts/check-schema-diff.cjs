const fs = require('fs');
const mariadb = require('mariadb');
require('dotenv').config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const url = new URL(databaseUrl);
  const host = url.hostname || 'localhost';
  const port = Number(url.port || 3306);
  const user = decodeURIComponent(url.username || 'root');
  const password = decodeURIComponent(url.password || '');
  const database = url.pathname.slice(1) || 'rithusnack_new';

  const c = await mariadb.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  const content = fs.readFileSync('prisma/schema.prisma', 'utf8');

  // Parse Enums
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  const enums = {};
  let em;
  while ((em = enumRegex.exec(content)) !== null) {
    enums[em[1]] = true;
  }

  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let m;
  const missingCols = [];

  while ((m = modelRegex.exec(content)) !== null) {
    const modelName = m[1];
    const body = m[2];
    let tableName = modelName;
    const tableMap = body.match(/@@map\("([^"]+)"\)/);
    if (tableMap) tableName = tableMap[1];

    const dbCols = await c.query(`DESCRIBE \`${tableName}\``).catch(() => null);
    if (!dbCols) {
      console.log('TABLE MISSING:', tableName);
      continue;
    }
    const existingCols = new Set(dbCols.map((x) => x.Field));

    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;
      const parts = trimmed.split(/\s+/);
      const fieldName = parts[0];
      const fieldType = parts[1];

      // If relation without scalar DB column
      if (trimmed.includes('@relation(') && !trimmed.includes('@db.') && !['String','Int','BigInt','Boolean','DateTime','Decimal','Float','Json','Bytes'].includes(fieldType.replace('?',''))) {
        continue;
      }
      if (!trimmed.includes('@db.') && !enums[fieldType.replace('?','')] && !['String','Int','BigInt','Boolean','DateTime','Decimal','Float','Json','Bytes'].includes(fieldType.replace('?',''))) {
        continue;
      }

      let colName = fieldName;
      const mapMatch = trimmed.match(/@map\("([^"]+)"\)/);
      if (mapMatch) colName = mapMatch[1];

      if (!existingCols.has(colName)) {
        missingCols.push({ tableName, colName, trimmed });
      }
    }
  }

  console.log('--- MISSING COLUMNS FOUND: ---');
  missingCols.forEach((mc) => {
    console.log(`Table: ${mc.tableName} -> Missing Column: ${mc.colName} (Line: ${mc.trimmed})`);
  });

  await c.end();
}

main().catch(console.error);
