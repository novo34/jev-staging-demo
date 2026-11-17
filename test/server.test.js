import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/app.js";

const SHA = "a".repeat(40);

async function withServer(db, fn) {
  const server = createServer({ db, env: { JEV_STAGING_REVISION: SHA } });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const fakeDb = (tableExists = true) => ({
  async query(sql) {
    if (sql.includes("to_regclass")) return { rows: [{ t: tableExists ? "greetings" : null }] };
    if (sql.includes("FROM greetings")) return { rows: [{ message: "Hola <JEV>" }, { message: "Segundo" }] };
    return { rows: [{ "?column?": 1 }] };
  }
});

test("/health devuelve status ok y la revisión", async () => {
  await withServer(fakeDb(), async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-jev-staging-revision"), SHA);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(body.revision, SHA);
  });
});

test("/health responde 503 si falta la tabla", async () => {
  await withServer(fakeDb(false), async (base) => {
    assert.equal((await fetch(`${base}/health`)).status, 503);
  });
});

test("/ lista los saludos escapados", async () => {
  await withServer(fakeDb(), async (base) => {
    const html = await (await fetch(base)).text();
    assert.match(html, /JEV staging demo/);
    assert.match(html, /<li>Hola &lt;JEV&gt;<\/li>/);
  });
});

test("ruta desconocida 404", async () => {
  await withServer(fakeDb(), async (base) => {
    assert.equal((await fetch(`${base}/nada`)).status, 404);
  });
});
