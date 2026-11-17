import http from "node:http";

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** `db` solo necesita `query(text, params)`; `env` aporta la revisión que inyecta el motor. */
export function createServer({ db, env = process.env }) {
  const revision = (env.JEV_STAGING_REVISION ?? "").toLowerCase();

  const send = (res, status, type, body) => {
    res.writeHead(status, { "content-type": type, "x-jev-staging-revision": revision, "cache-control": "no-store" });
    res.end(body);
  };

  return http.createServer(async (req, res) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (req.method !== "GET") return send(res, 405, "text/plain", "method not allowed");
    try {
      if (path === "/health") {
        try {
          await db.query("SELECT 1");
          const t = await db.query("SELECT to_regclass('public.greetings') AS t");
          if (!t.rows[0]?.t) throw new Error("tabla greetings ausente");
          return send(res, 200, "application/json", JSON.stringify({ status: "ok", revision, database: "ok" }));
        } catch {
          return send(res, 503, "application/json", JSON.stringify({ status: "error", revision, database: "error" }));
        }
      }
      if (path === "/") {
        const { rows } = await db.query("SELECT message FROM greetings ORDER BY id");
        const items = rows.map((r) => `<li>${escapeHtml(r.message)}</li>`).join("");
        return send(res, 200, "text/html; charset=utf-8", `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>JEV staging demo</title></head><body><h1>JEV staging demo</h1><ul>${items}</ul></body></html>`);
      }
      return send(res, 404, "text/plain", "not found");
    } catch {
      return send(res, 500, "text/plain", "error interno");
    }
  });
}
