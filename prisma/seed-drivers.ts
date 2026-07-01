import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Driver@123', 10);

  const driver1 = await prisma.user.upsert({
    where: { phone: '+923011111101' },
    update: {},
    create: {
      name: 'Ali Raza',
      phone: '+923011111101',
      passwordHash: hash,
      role: 'DRIVER',
      isActive: true,
      verified: true,
      locationLat: 24.9263,
      locationLng: 67.0845,
    },
  });

  const driver2 = await prisma.user.upsert({
    where: { phone: '+923011111102' },
    update: {},
    create: {
      name: 'Usman Khan',
      phone: '+923011111102',
      passwordHash: hash,
      role: 'DRIVER',
      isActive: true,
      verified: true,
      locationLat: 24.9300,
      locationLng: 67.0900,
    },
  });

  console.log('Seeded drivers:');
  console.log(`  Driver 1: ${driver1.name} | ${driver1.phone} | ID: ${driver1.id}`);
  console.log(`  Driver 2: ${driver2.name} | ${driver2.phone} | ID: ${driver2.id}`);
  console.log('\nPassword for both: Driver@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
