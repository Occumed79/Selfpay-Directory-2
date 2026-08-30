INSERT INTO stress_test_locations (
  provider, city, state, zip, address, price, service, match_text,
  access, tier, source_url, latitude, longitude, phone, fax, email,
  footprint_note, updated_at
)
VALUES
  (
    'Independent Physicians Medical Center (IPMC)',
    'Philadelphia',
    'PA',
    '19115',
    '9908 Roosevelt Blvd, Philadelphia, PA 19115',
    150,
    'Stress EKG',
    'Stress Echo / Stress EKG — $500 / $150',
    'Self-pay; prescription required for diagnostic testing',
    'Direct provider self-pay price',
    'https://ipmcmed.com/self-pay/',
    NULL,
    NULL,
    '215-464-3300',
    '215-464-0805',
    'reports@ipmcmed.com',
    'Independent outpatient medical center with cardiology, imaging, and clinic services under one roof.',
    NOW()
  ),
  (
    'Telluride Regional Medical Center',
    'Telluride',
    'CO',
    '81435',
    '500 West Pacific Ave, Telluride, CO 81435',
    88,
    'CPT 93015 Cardiovascular Stress Test',
    '93015 — Cardiovascular stress test using treadmill/bicycle exercise — Self Pay Fee $88',
    'Self-pay fee published in active May 2025 fee schedule',
    'Direct provider fee schedule',
    'https://www.tellmed.org/files/65f2aa6dd/Fee%2BSchedule-%2BActive_May%2B2025.pdf',
    NULL,
    NULL,
    '970-728-3848',
    '970-728-3404',
    NULL,
    'Telluride Regional Medical Center main clinic; current provider fee schedule explicitly labels the allowed amount as the Self Pay Fee.',
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
