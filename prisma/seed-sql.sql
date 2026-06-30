-- Seed two new drivers: Ali Raza and Usman Khan
-- Password: Driver@123

INSERT INTO "User" (id, name, phone, "passwordHash", role, "isActive", verified, "locationLat", "locationLng", "createdAt", "updatedAt")
VALUES
  (
    gen_random_uuid(),
    'Ali Raza',
    '+923011111101',
    '$2b$10$BrlG7vU9RUwjQ3vjU97fK.CIofyAX5.K2Y4YfWVUwHCVy4w.bq.nK',
    'DRIVER',
    true,
    true,
    24.9263,
    67.0845,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Usman Khan',
    '+923011111102',
    '$2b$10$BrlG7vU9RUwjQ3vjU97fK.CIofyAX5.K2Y4YfWVUwHCVy4w.bq.nK',
    'DRIVER',
    true,
    true,
    24.9300,
    67.0900,
    NOW(),
    NOW()
  )
ON CONFLICT (phone) DO NOTHING;
