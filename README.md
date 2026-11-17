# jev-staging-demo

App mínima (Node 22, ESM, solo `pg`) que sirve como primer caso real del motor de staging de JEV (PLT-012).

## Contrato con JEV

El motor construye la imagen desde `Dockerfile` en el commit exacto (`<repo>#<sha>`) y levanta app + PostgreSQL propio.

- Puerto: `3000` (por defecto; `PORT` lo sobrescribe). Es el `appPort` por defecto de `StagingDeploymentSettings`.
- Variables inyectadas por el motor: `DATABASE_URL` (rol runtime), `JEV_STAGING_REVISION` (SHA de 40 hex), `STAGING_*`. Migración y seed reciben `DATABASE_URL` con el rol propietario.
- Health: `GET /health` devuelve 200 `{"status":"ok","revision":"<sha>","database":"ok"}`; 503 si la BD o la tabla `greetings` fallan. También envía la cabecera `x-jev-staging-revision`.
- Configuración en `StagingDeploymentSettings`:
  - `healthPath: "/health"` (el motor usa `/` por defecto)
  - `migrationCommand: "node src/migrate.js"`
  - `seedCommand: "node src/seed.js"`
  - `appPort: 3000`
  - `e2eRoutes: [{ path: "/", bodyIncludes: "JEV staging demo" }]`

## Local

```bash
npm ci
npm test
export DATABASE_URL=postgresql://usuario:clave@localhost:5432/jev_demo
npm run migrate && npm run seed
JEV_STAGING_REVISION=$(git rev-parse HEAD) npm start
curl localhost:3000/health
```
