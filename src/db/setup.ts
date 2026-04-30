import 'dotenv/config';
import { Pool } from 'pg';

async function setup() {
  const connectionString = process.env.DATABASE_URL || '';
  const url = new URL(connectionString);
  const dbName = url.pathname.slice(1);
  url.pathname = '/postgres';

  const pool = new Pool({
    connectionString: url.toString(),
  });

  try {
    console.log(`Checking if database "${dbName}" exists...`);
    const res = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName],
    );

    if (res.rowCount === 0) {
      console.log(`Creating database "${dbName}"...`);
      await pool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully!`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Setup failed:', err.message);
  } finally {
    await pool.end();
  }
}

setup();
