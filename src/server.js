import { createServer } from "./app.js";
import { createPool } from "./db.js";

const port = Number(process.env.PORT ?? 3000);
const pool = createPool();
const server = createServer({ db: pool });
server.listen(port, "0.0.0.0", () => console.log(`jev-staging-demo escuchando en ${port}`));

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => server.close(() => pool.end().finally(() => process.exit(0))));
}
