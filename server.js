require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const HTML_FILE = path.join(__dirname, 'Stress_Test_Price_Atlas_EDITORIAL_CATALOGUE_v13.html');
const htmlTemplate = fs.readFileSync(HTML_FILE, 'utf8');

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. The app will use the HTML embedded fallback data until Neon is configured.');
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : null;

function rowsToFrontend(rows) {
  return rows.map((r) => ({
    price: Number(r.price),
    state: r.state,
    city: r.city,
    zip: r.zip,
    provider: r.provider,
    address: r.address,
    service: r.service,
    match: r.match_text,
    access: r.access,
    tier: r.tier,
    source: r.source_url,
    lat: r.latitude == null ? null : Number(r.latitude),
    lon: r.longitude == null ? null : Number(r.longitude),
    phone: r.phone || '',
    fax: r.fax || '',
    email: r.email || '',
    footprint_note: r.footprint_note || '',
  }));
}

async function getLocations() {
  if (!pool) return null;
  const { rows } = await pool.query(`
    SELECT provider, city, state, zip, address, price, service, match_text,
           access, tier, source_url, latitude, longitude, phone, fax, email,
           footprint_note
    FROM stress_test_locations
    ORDER BY price ASC, state ASC, city ASC, provider ASC
  `);
  return rowsToFrontend(rows);
}

function injectRuntimeData(template, locations) {
  let output = template;
  if (Array.isArray(locations) && locations.length) {
    const safeJson = JSON.stringify(locations).replace(/<\//g, '<\\/');
    output = output.replace(/const DATA=\[[\s\S]*?\];/, `const DATA=${safeJson};`);
  }

  const maptilerKey = process.env.MAPTILER_KEY || '';
  const safeKey = JSON.stringify(maptilerKey).replace(/<\//g, '<\\/');
  output = output.replace(
    '<head>',
    `<head>\n<script>window.__MAPTILER_KEY__=${safeKey};</script>`
  );
  output = output.replace(
    /localStorage\.getItem\("cpt93015_maptiler_key"\)\|\|""/g,
    '(window.__MAPTILER_KEY__ || localStorage.getItem("cpt93015_maptiler_key") || "")'
  );
  return output;
}

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res) => {
  try {
    if (!pool) {
      return res.status(200).json({ ok: true, database: 'not-configured', service: 'stress-test-price-atlas' });
    }
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected', service: 'stress-test-price-atlas' });
  } catch (error) {
    res.status(503).json({ ok: false, database: 'error', message: error.message });
  }
});

app.get('/api/locations', async (_req, res) => {
  try {
    const locations = await getLocations();
    if (!locations) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
    res.set('Cache-Control', 'no-store');
    res.json(locations);
  } catch (error) {
    console.error('GET /api/locations failed:', error);
    res.status(500).json({ error: 'Unable to load locations' });
  }
});

app.get('/api/stats', async (_req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int AS location_count,
             COUNT(DISTINCT provider)::int AS provider_count,
             COUNT(DISTINCT state)::int AS state_count,
             MIN(price)::int AS lowest_price,
             MAX(price)::int AS highest_price,
             percentile_cont(0.5) WITHIN GROUP (ORDER BY price)::numeric AS median_price
      FROM stress_test_locations
    `);
    const stats = rows[0];
    stats.median_price = stats.median_price == null ? null : Number(stats.median_price);
    res.set('Cache-Control', 'no-store');
    res.json(stats);
  } catch (error) {
    console.error('GET /api/stats failed:', error);
    res.status(500).json({ error: 'Unable to load stats' });
  }
});

async function serveAtlas(_req, res) {
  try {
    let locations = null;
    try {
      locations = await getLocations();
    } catch (dbError) {
      console.error('Neon query failed; using embedded HTML fallback data:', dbError.message);
    }
    res.type('html').send(injectRuntimeData(htmlTemplate, locations));
  } catch (error) {
    console.error('Unable to serve atlas:', error);
    res.status(500).send('Unable to load the Stress Test Price Atlas.');
  }
}

app.get('/', serveAtlas);
app.get('/catalogue', serveAtlas);
app.get('/Stress_Test_Price_Atlas_EDITORIAL_CATALOGUE_v13.html', serveAtlas);

app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Stress Test Price Atlas listening on port ${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  server.close(async () => {
    if (pool) await pool.end().catch(() => {});
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
