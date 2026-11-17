import { createPool } from "./db.js";

const pool = createPool();
try {
  await pool.query("CREATE TABLE IF NOT EXISTS greetings (id serial PRIMARY KEY, message text NOT NULL UNIQUE)");
  console.log("migrate: ok");
} catch (error) {
  console.error("migrate: error", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
