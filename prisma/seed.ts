import { PrismaClient, Role, AmbulanceType, AmbulanceStatus, RideRequestStatus, RegistrationStatus, PaymentMethod } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Seeding ResQLink database...\n');

  // ── 0. Clean existing data (reverse dependency order) ─────────
  await prisma.ambulanceTracking.deleteMany();
  await prisma.rideRequestAttempt.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.adminAction.deleteMany();
  await prisma.driverPerformance.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.paramedicProfile.deleteMany();
  await prisma.ambulance.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.organization.deleteMany();
  console.log('  🧹 Cleared existing seed data\n');

  // ── 1. Users (all 4 roles) ──────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@1234', SALT_ROUNDS);
  const userPassword = await bcrypt.hash('Patient@1234', SALT_ROUNDS);
  const driverPassword = await bcrypt.hash('Driver@1234', SALT_ROUNDS);
  const paramedicPassword = await bcrypt.hash('Paramedic@1234', SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@resqlink.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@resqlink.com',
      phone: '+923001111111',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      verified: true,
      isActive: true,
    },
  });
  console.log(`  ✅ Admin:     ${admin.email} (password: Admin@1234)`);

  const patient = await prisma.user.upsert({
    where: { email: 'patient@resqlink.com' },
    update: {},
    create: {
      name: 'John Patient',
      email: 'patient@resqlink.com',
      phone: '+923002222222',
      passwordHash: userPassword,
      role: Role.USER,
      verified: true,
      isActive: true,
      locationLat: 24.8700,
      locationLng: 67.0100,
    },
  });
  console.log(`  ✅ Patient:   ${patient.email} (password: Patient@1234)`);

  const patient2 = await prisma.user.upsert({
    where: { email: 'sara@resqlink.com' },
    update: {},
    create: {
      name: 'Sara Ahmed',
      email: 'sara@resqlink.com',
      phone: '+923002222233',
      passwordHash: userPassword,
      role: Role.USER,
      verified: true,
      isActive: true,
      locationLat: 24.8900,
      locationLng: 67.0300,
    },
  });
  console.log(`  ✅ Patient 2: ${patient2.email} (password: Patient@1234)`);

  const driver1 = await prisma.user.upsert({
    where: { email: 'driver@resqlink.com' },
    update: {},
    create: {
      name: 'Ahmed Driver',
      email: 'driver@resqlink.com',
      phone: '+923003333333',
      passwordHash: driverPassword,
      role: Role.DRIVER,
      verified: true,
      isActive: true,
      locationLat: 24.8607,
      locationLng: 67.0011,
    },
  });
  console.log(`  ✅ Driver 1:  ${driver1.email} (password: Driver@1234)`);

  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@resqlink.com' },
    update: {},
    create: {
      name: 'Hassan Ali',
      email: 'driver2@resqlink.com',
      phone: '+923003333344',
      passwordHash: driverPassword,
      role: Role.DRIVER,
      verified: true,
      isActive: true,
      locationLat: 24.9200,
      locationLng: 67.0800,
    },
  });
  console.log(`  ✅ Driver 2:  ${driver2.email} (password: Driver@1234)`);

  const paramedic1 = await prisma.user.upsert({
    where: { email: 'paramedic@resqlink.com' },
    update: {},
    create: {
      name: 'Dr. Fatima Khan',
      email: 'paramedic@resqlink.com',
      phone: '+923004444444',
      passwordHash: paramedicPassword,
      role: Role.PARAMEDIC,
      verified: true,
      isActive: true,
    },
  });
  console.log(`  ✅ Paramedic: ${paramedic1.email} (password: Paramedic@1234)`);

  const paramedic2 = await prisma.user.upsert({
    where: { email: 'paramedic2@resqlink.com' },
    update: {},
    create: {
      name: 'Dr. Ali Raza',
      email: 'paramedic2@resqlink.com',
      phone: '+923004444455',
      passwordHash: paramedicPassword,
      role: Role.PARAMEDIC,
      verified: true,
      isActive: true,
    },
  });
  console.log(`  ✅ Paramedic: ${paramedic2.email} (password: Paramedic@1234)`);

  // ── 2. Organizations ────────────────────────────────────────────
  const org1 = await prisma.organization.upsert({
    where: { id: admin.id }, // dummy — will create
    update: {},
    create: {
      name: 'City Health Services',
      address: '123 Main Street, Karachi',
      contactEmail: 'info@cityhealth.com',
      contactPhone: '+923001234567',
    },
  });

  const org2 = await prisma.organization.upsert({
    where: { id: patient.id }, // dummy — will create
    update: {},
    create: {
      name: 'Emergency Response Network',
      address: '456 Emergency Ave, Lahore',
      contactEmail: 'info@ern.com',
      contactPhone: '+923009876543',
    },
  });
  console.log(`  ✅ Organizations: ${org1.name}, ${org2.name}`);

  // ── 3. Hospitals ────────────────────────────────────────────────
  const hospital1 = await prisma.hospital.create({
    data: {
      name: 'City General Hospital',
      address: '789 Hospital Road, Karachi',
      contactPhone: '+923005555555',
      locationLat: 24.8600,
      locationLng: 67.0000,
      organizationId: org1.id,
    },
  });

  const hospital2 = await prisma.hospital.create({
    data: {
      name: 'Emergency Care Center',
      address: '321 Emergency Street, Karachi',
      contactPhone: '+923006666666',
      locationLat: 24.9200,
      locationLng: 67.0500,
      organizationId: org1.id,
    },
  });

  const hospital3 = await prisma.hospital.create({
    data: {
      name: 'Lahore Medical Complex',
      address: '100 Medical Avenue, Lahore',
      contactPhone: '+923007777777',
      locationLat: 31.5204,
      locationLng: 74.3587,
      organizationId: org2.id,
    },
  });
  console.log(`  ✅ Hospitals: ${hospital1.name}, ${hospital2.name}, ${hospital3.name}`);

  // ── 4. Ambulances ──────────────────────────────────────────────
  const amb1 = await prisma.ambulance.create({
    data: {
      registrationNumber: 'KHI-AMB-001',
      type: AmbulanceType.BASIC,
      status: AmbulanceStatus.AVAILABLE,
      currentLat: 24.8607,
      currentLng: 67.0011,
      organizationId: org1.id,
    },
  });

  const amb2 = await prisma.ambulance.create({
    data: {
      registrationNumber: 'KHI-AMB-002',
      type: AmbulanceType.WITH_DOCTOR,
      status: AmbulanceStatus.AVAILABLE,
      currentLat: 24.9000,
      currentLng: 67.0500,
      organizationId: org1.id,
    },
  });

  const amb3 = await prisma.ambulance.create({
    data: {
      registrationNumber: 'KHI-AMB-003',
      type: AmbulanceType.BASIC,
      status: AmbulanceStatus.BUSY,
      currentLat: 24.8800,
      currentLng: 67.0300,
      organizationId: org1.id,
    },
  });

  const amb4 = await prisma.ambulance.create({
    data: {
      registrationNumber: 'KHI-AMB-004',
      type: AmbulanceType.BASIC,
      status: AmbulanceStatus.MAINTENANCE,
      organizationId: org1.id,
    },
  });

  const amb5 = await prisma.ambulance.create({
    data: {
      registrationNumber: 'LHR-AMB-001',
      type: AmbulanceType.WITH_DOCTOR,
      status: AmbulanceStatus.AVAILABLE,
      currentLat: 31.5204,
      currentLng: 74.3587,
      organizationId: org2.id,
    },
  });

  const amb6 = await prisma.ambulance.create({
    data: {
      registrationNumber: 'KHI-AMB-005',
      type: AmbulanceType.BASIC,
      status: AmbulanceStatus.OFFLINE,
      organizationId: org2.id,
    },
  });
  console.log(`  ✅ Ambulances: 6 registered (3 available, 1 busy, 1 maintenance, 1 offline)`);

  // ── 5. Paramedic Profiles ──────────────────────────────────────
  const paramProfile1 = await prisma.paramedicProfile.create({
    data: {
      userId: paramedic1.id,
      experienceYears: 5,
      status: RegistrationStatus.VERIFIED,
      notes: 'Senior paramedic, trauma specialist',
      verifiedAt: new Date(),
    },
  });

  const paramProfile2 = await prisma.paramedicProfile.create({
    data: {
      userId: paramedic2.id,
      experienceYears: 2,
      status: RegistrationStatus.PENDING,
      notes: 'New recruit, documents under review',
    },
  });
  console.log(`  ✅ Paramedic Profiles: 1 verified, 1 pending`);

  // ── 6. Ride Requests (various statuses) ────────────────────────
  const ride1 = await prisma.rideRequest.create({
    data: {
      userId: patient.id,
      ambulanceType: AmbulanceType.BASIC,
      pickupLat: 24.8700,
      pickupLng: 67.0100,
      destinationLat: 24.8600,
      destinationLng: 67.0000,
      status: RideRequestStatus.CREATED,
      paymentMethod: PaymentMethod.CASH,
      hospitalId: hospital1.id,
    },
  });

  const ride2 = await prisma.rideRequest.create({
    data: {
      userId: patient2.id,
      ambulanceType: AmbulanceType.WITH_DOCTOR,
      pickupLat: 24.8500,
      pickupLng: 67.0200,
      destinationLat: 24.9200,
      destinationLng: 67.0500,
      status: RideRequestStatus.IN_TRIP,
      assignedDriverId: driver1.id,
      assignedParamedicId: paramedic1.id,
      ambulanceId: amb3.id,
      hospitalId: hospital2.id,
      etaMinutes: 8,
      paymentMethod: PaymentMethod.CASH,
    },
  });

  const ride3 = await prisma.rideRequest.create({
    data: {
      userId: patient.id,
      ambulanceType: AmbulanceType.BASIC,
      pickupLat: 24.8900,
      pickupLng: 67.0400,
      destinationLat: 24.8600,
      destinationLng: 67.0000,
      status: RideRequestStatus.WAITING_DRIVER_ACCEPT,
      ambulanceId: amb2.id,
      hospitalId: hospital1.id,
      etaMinutes: 5,
      paymentMethod: PaymentMethod.CARD,
    },
  });

  const ride4 = await prisma.rideRequest.create({
    data: {
      userId: patient2.id,
      ambulanceType: AmbulanceType.BASIC,
      pickupLat: 24.8650,
      pickupLng: 67.0150,
      destinationLat: 24.8600,
      destinationLng: 67.0000,
      status: RideRequestStatus.COMPLETED,
      assignedDriverId: driver2.id,
      ambulanceId: amb1.id,
      hospitalId: hospital1.id,
      etaMinutes: 3,
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      paymentMethod: PaymentMethod.CASH,
    },
  });

  const ride5 = await prisma.rideRequest.create({
    data: {
      userId: patient.id,
      ambulanceType: AmbulanceType.BASIC,
      pickupLat: 24.8750,
      pickupLng: 67.0050,
      status: RideRequestStatus.CANCELLED,
      cancelledAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      paymentMethod: PaymentMethod.CASH,
    },
  });
  console.log(`  ✅ Ride Requests: 5 (CREATED, IN_TRIP, WAITING, COMPLETED, CANCELLED)`);

  // ── 7. Driver Performance ──────────────────────────────────────
  await prisma.driverPerformance.create({
    data: {
      driverId: driver1.id,
      totalRides: 45,
      averageResponseTime: 3.5,
      rating: 4.8,
      lastActive: new Date(),
    },
  });

  await prisma.driverPerformance.create({
    data: {
      driverId: driver2.id,
      totalRides: 22,
      averageResponseTime: 5.2,
      rating: 4.2,
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    },
  });
  console.log(`  ✅ Driver Performance: 2 records`);

  // ── 8. Admin Actions (Audit Log) ──────────────────────────────
  await prisma.adminAction.create({
    data: {
      adminId: admin.id,
      action: 'VERIFY_PARAMEDIC',
      targetId: paramProfile1.id,
      metadata: { reason: 'Documents verified', approvedAt: new Date().toISOString() },
    },
  });

  await prisma.adminAction.create({
    data: {
      adminId: admin.id,
      action: 'REGISTER_AMBULANCE',
      targetId: amb1.id,
      metadata: { registrationNumber: 'KHI-AMB-001' },
    },
  });

  await prisma.adminAction.create({
    data: {
      adminId: admin.id,
      action: 'DISPATCH_AMBULANCE',
      targetId: ride2.id,
      metadata: { ambulanceId: amb3.id, driverId: driver1.id },
    },
  });
  console.log(`  ✅ Admin Actions: 3 audit log entries`);

  // ── 9. Ambulance Tracking Logs ─────────────────────────────────
  const now = Date.now();
  for (let i = 0; i < 5; i++) {
    await prisma.ambulanceTracking.create({
      data: {
        ambulanceId: amb3.id,
        rideRequestId: ride2.id,
        lat: 24.8500 + i * 0.002,
        lng: 67.0200 + i * 0.001,
        recordedAt: new Date(now - (5 - i) * 60000), // every minute
      },
    });
  }
  console.log(`  ✅ Tracking Logs: 5 location points for active ride`);

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('── Login Credentials ──────────────────');
  console.log('  Admin:     admin@resqlink.com     / Admin@1234');
  console.log('  Patient:   patient@resqlink.com   / Patient@1234');
  console.log('  Driver:    driver@resqlink.com    / Driver@1234');
  console.log('  Paramedic: paramedic@resqlink.com / Paramedic@1234');
  console.log('───────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
