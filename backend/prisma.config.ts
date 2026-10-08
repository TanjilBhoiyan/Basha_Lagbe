// Prisma CLI settings (migrate, generate, studio, seed).
// Prisma does not read .env by itself, so we load it here.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // npx prisma db seed  -> fills the database with sample data
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});