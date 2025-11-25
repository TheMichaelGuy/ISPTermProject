import postgres from 'postgres';
//import { neon } from '@neondatabase/serverless';

// Use environment variable for connection string
//const sql = neon(process.env.DATABASE_URL!);
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export default sql;
