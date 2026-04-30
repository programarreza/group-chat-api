import 'dotenv/config';
import { Pool } from 'pg';

const sql = `
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"username" varchar(24) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

CREATE TABLE IF NOT EXISTS "rooms" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(32) NOT NULL,
	"created_by" varchar(24) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "messages" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"room_id" varchar(50) NOT NULL,
	"username" varchar(24) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
`;

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await pool.query(sql);
    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
