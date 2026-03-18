import { defineConfig } from "drizzle-kit";
import { loadEnv } from "vite";

const env = loadEnv("", process.cwd(), "");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.POSTGRES_URL_DEV,
  },
});
