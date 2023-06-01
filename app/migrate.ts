import dotenv from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const db = drizzle(postgres(`${process.env.DATABASE_URL}`, { ssl: 'require', max: 1 }));

async function main() {
  try {
    await migrate(db, { migrationsFolder: 'migrations' });
    console.log('Migration completed');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
  process.exit(0);
}

main();
