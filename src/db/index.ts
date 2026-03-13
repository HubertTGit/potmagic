import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  // In production, we expect this to be set. 
  // In development, if running via 'pnpm build && pnpm start', 
  // you may need to source your .env file first.
  console.warn('POSTGRES_URL is not set. Database connection may fail.');
}

const client = postgres(POSTGRES_URL || '');
export const db = drizzle({ client, schema });
