import pg from "pg";

export function createPool(env = process.env) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL no definida");
  return new pg.Pool({ connectionString: env.DATABASE_URL, max: 4, connectionTimeoutMillis: 5000 });
}
