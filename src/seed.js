import { createPool } from "./db.js";

const MESSAGES = ["Hola desde JEV", "Staging operativo", "Datos sintéticos de prueba"];
const pool = createPool();
try {
  for (const message of MESSAGES) {
    await pool.query("INSERT INTO greetings (message) VALUES ($1) ON CONFLICT DO NOTHING", [message]);
  }
  console.log("seed: ok");
} catch (error) {
  console.error("seed: error", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
