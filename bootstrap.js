require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const HTML_FILE = path.join(__dirname, 'Stress_Test_Price_Atlas_EDITORIAL_CATALOGUE_v13.html');
const SCHEMA_FILE = path.join(__dirname, 'db', 'schema.sql');

function readEmbeddedRegistry() {
  const html = fs.readFileSync(HTML_FILE, 'utf8');
  const match = html.match(/const DATA=(\[[\s\S]*?\]);/);
  if (!match) throw new Error('Unable to locate embedded registry DATA');
  return JSON.parse(match[1]);
}

async function seedEmbeddedRegistry() {
  if (!process.env.DATABASE_URL) return;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    connectionTimeoutMillis: 10000,
  });

  try {
    await pool.query(fs.readFileSync(SCHEMA_FILE, 'utf8'));
    const rows = readEmbeddedRegistry();
    await pool.query('BEGIN');

    const sql = `
      INSERT INTO stress_test_locations (
        provider, city, state, zip, address, price, service, match_text,
        access, tier, source_url, latitude, longitude, phone, fax, email,
        footprint_note, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW()
      )
      ON CONFLICT (provider, city, state, zip, service, price)
      DO UPDATE SET
        address = EXCLUDED.address,
        match_text = EXCLUDED.match_text,
        access = EXCLUDED.access,
        tier = EXCLUDED.tier,
        source_url = EXCLUDED.source_url,
        latitude = COALESCE(EXCLUDED.latitude, stress_test_locations.latitude),
        longitude = COALESCE(EXCLUDED.longitude, stress_test_locations.longitude),
        phone = EXCLUDED.phone,
        fax = EXCLUDED.fax,
        email = EXCLUDED.email,
        footprint_note = EXCLUDED.footprint_note,
        updated_at = NOW()
    `;

    for (const r of rows) {
      await pool.query(sql, [
        r.provider, r.city, r.state, r.zip, r.address, Number(r.price), r.service,
        r.match || '', r.access || '', r.tier || '', r.source || '',
        r.lat ?? null, r.lon ?? null, r.phone || null, r.fax || null,
        r.email || null, r.footprint_note || null,
      ]);
    }

    await pool.query('COMMIT');
    console.log(`Embedded registry seeded into Neon: ${rows.length} verified locations`);
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Embedded Neon seed failed:', error.message);
  } finally {
    await pool.end().catch(() => {});
  }
}

seedEmbeddedRegistry()
  .catch((error) => console.error('Bootstrap error:', error.message))
  .finally(() => require('./server'));
