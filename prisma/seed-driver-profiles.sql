-- Create DriverProfile entries for Ali Raza and Usman Khan
-- Both pre-verified so they appear in admin and can be paired

INSERT INTO "DriverProfile" (id, "userId", "licenseNumber", "experienceYears", status, "verifiedAt", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  u.id,
  CASE u.phone
    WHEN '+923011111101' THEN 'LIC-ALI-2024'
    WHEN '+923011111102' THEN 'LIC-USM-2024'
  END,
  3,
  'VERIFIED',
  NOW(),
  NOW(),
  NOW()
FROM "User" u
WHERE u.phone IN ('+923011111101', '+923011111102')
  AND NOT EXISTS (
    SELECT 1 FROM "DriverProfile" dp WHERE dp."userId" = u.id
  );
