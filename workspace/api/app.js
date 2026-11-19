const express = require('express');
const sql = require('mssql');

const app = express();
const port = process.env.PORT || 3080;

const healthConfig = {
  server: process.env.DB_SERVER || 'ict-db',
  port: Number(process.env.DB_PORT) || 1433,
  database: 'master',
  user: 'sa',
  password: process.env.DB_SA_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  connectionTimeout: 5000,
  requestTimeout: 5000,
  pool: { min: 0, max: 1 },
};

app.get('/', (req, res) => {
  res.json({ service: 'ict-api', status: 'ok' });
});

app.get('/health/db', async (req, res) => {
  const started = Date.now();
  let pool;
  try {
    pool = await new sql.ConnectionPool(healthConfig).connect();
    await pool.request().query('SELECT 1 AS ok');
    res.json({
      status: 'ok',
      database: 'master',
      login: 'sa',
      latencyMs: Date.now() - started,
    });
  } catch (err) {
    console.error('db health check failed:', err.message);
    res.status(503).json({ status: 'error', latencyMs: Date.now() - started });
  } finally {
    if (pool) {
      await pool.close().catch(() => {});
    }
  }
});

app.listen(port, () => {
  console.log(`ict-api listening on port ${port}`);
});
