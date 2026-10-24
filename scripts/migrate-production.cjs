const { execSync } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('🚀 Running Production Database Migrations & Sync');
console.log('====================================================');

const scripts = [
  'db-sync.cjs',
  'migrate-weight-courier.cjs',
  'migrate-shiprocket-support.cjs',
  'migrate-return-shiprocket.cjs',
];

for (const script of scripts) {
  const scriptPath = path.resolve(__dirname, script);
  console.log(`\n▶ Executing: ${script}...`);
  try {
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    console.log(`✔ ${script} completed successfully.`);
  } catch (error) {
    console.error(`✖ Error executing ${script}:`, error.message);
    process.exit(1);
  }
}

console.log('\n====================================================');
console.log('🎉 All production database migrations completed successfully!');
console.log('====================================================');
