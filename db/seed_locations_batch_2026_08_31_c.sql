INSERT INTO stress_test_locations (
  provider, city, state, zip, address, price, service, match_text,
  access, tier, source_url, latitude, longitude, phone, fax, email,
  footprint_note, updated_at
)
VALUES
  (
    'Telluride Regional Medical Center',
    'Telluride',
    'CO',
    '81435',
    '500 West Pacific Ave, Telluride, CO 81435',
    88,
    'CPT 93015 Cardiovascular Stress Test',
    'Active May 2025 provider fee schedule: CPT 93015 — cardiovascular stress test using treadmill/bicycle exercise with continuous ECG — Allowed Fee (Self Pay Fee) $88',
    'Direct provider self-pay fee schedule',
    'A+',
    'https://www.tellmed.org/files/65f2aa6dd/Fee%2BSchedule-%2BActive_May%2B2025.pdf',
    NULL,
    NULL,
    '970-728-3848',
    '970-728-3404',
    NULL,
    'Telluride Regional Medical Center remains active in 2026 at 500 West Pacific Ave. The provider-hosted Active May 2025 fee schedule explicitly labels the applicable column Allowed Fee (Self Pay Fee) and lists CPT 93015 at $88.',
    NOW()
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
  updated_at = NOW();
