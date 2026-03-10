import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');

const client = postgres(env.POSTGRES_URL!);
export const db = drizzle({ client, schema });
