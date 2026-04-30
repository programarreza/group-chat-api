import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

import { DB_CONNECTION } from '../constants';

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      useFactory: () => {
        const isLocal = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: isLocal ? false : { rejectUnauthorized: false },
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DB_CONNECTION],
})
export class DbModule {}
