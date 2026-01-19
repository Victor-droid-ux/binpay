import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { User, State, BinRegistration } from './models';
import { generateBinId } from './utils/binId';

// Load environment variables
dotenv.config();

async function seed() {
  try {
    await connectDatabase();

    console.log('🌱 Starting database seed...');

    // Clear existing data
    await User.deleteMany({});
    await State.deleteMany({});
    await BinRegistration.deleteMany({});

    // Create super admin
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!@#';
    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await User.create({
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@binpay.ng',
      phone: '+2348000000000',
      password: hashedSuperAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
    });

    console.log('✅ Super admin created:', superAdmin.email);
    console.log('   Password:', superAdminPassword);

    // Create a test regular user
    const testUserPassword = 'User123!@#';
    const hashedUserPassword = await bcrypt.hash(testUserPassword, 10);

    const testUser = await User.create({
      email: 'user@test.com',
      phone: '+2348012345678',
      password: hashedUserPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isActive: true,
      isVerified: true,
      emailVerified: true,
      phoneVerified: true,
    });

    console.log('✅ Test user created:', testUser.email);
    console.log('   Password:', testUserPassword);

    // Seed Nigerian States
    const statesData = [
      {
        name: 'Lagos',
        code: 'lagos',
        capital: 'Ikeja',
        authorityName: 'LAWMA',
        authorityFullName: 'Lagos Waste Management Authority',
        authorityWebsite: 'https://lawma.gov.ng',
        authorityPhone: '+234 1 234 5678',
        authorityEmail: 'info@lawma.gov.ng',
        headquarters: 'Ikeja',
        binIdFormat: 'LA######',
        billCycle: 'monthly',
        averageBill: 750000,
        monthlyBillAmount: 2000,
        isActive: true,
        lgas: [
          { name: 'Agege' }, { name: 'Ajeromi-Ifelodun' }, { name: 'Alimosho' },
          { name: 'Amuwo-Odofin' }, { name: 'Apapa' }, { name: 'Badagry' },
          { name: 'Epe' }, { name: 'Eti Osa' }, { name: 'Ibeju-Lekki' },
          { name: 'Ifako-Ijaiye' }, { name: 'Ikeja' }, { name: 'Ikorodu' },
          { name: 'Kosofe' }, { name: 'Lagos Island' }, { name: 'Lagos Mainland' },
          { name: 'Mushin' }, { name: 'Ojo' }, { name: 'Oshodi-Isolo' },
          { name: 'Shomolu' }, { name: 'Surulere' },
        ],
        zones: [
          { name: 'Lagos Island' }, { name: 'Lagos Mainland' },
          { name: 'Surulere' }, { name: 'Ikeja' }, { name: 'Ikorodu' },
        ],
      },
      {
        name: 'Federal Capital Territory',
        code: 'fct',
        capital: 'Abuja',
        authorityName: 'AEPB',
        authorityFullName: 'Abuja Environmental Protection Board',
        authorityWebsite: 'https://aepb.gov.ng',
        authorityPhone: '+234 9 234 5678',
        authorityEmail: 'info@aepb.gov.ng',
        headquarters: 'Abuja',
        binIdFormat: 'FC######',
        billCycle: 'monthly',
        averageBill: 650000,
        monthlyBillAmount: 1500,
        isActive: true,
        lgas: [
          { name: 'Abaji' }, { name: 'Bwari' }, { name: 'Gwagwalada' },
          { name: 'Kuje' }, { name: 'Municipal Area Council' }, { name: 'Kwali' },
        ],
        zones: [
          { name: 'Abuja Municipal' }, { name: 'Gwagwalada' },
          { name: 'Kuje' }, { name: 'Bwari' }, { name: 'Kwali' }, { name: 'Abaji' },
        ],
      },
      {
        name: 'Enugu',
        code: 'enugu',
        capital: 'Enugu',
        authorityName: 'ESWAMA',
        authorityFullName: 'Enugu State Waste Management Authority',
        authorityWebsite: 'https://enugustate.gov.ng',
        authorityPhone: '+234 42 234 5678',
        authorityEmail: 'info@eswama.gov.ng',
        headquarters: 'Enugu',
        binIdFormat: 'EN######',
        billCycle: 'monthly',
        averageBill: 400000,
        monthlyBillAmount: 1200,
        isActive: true,
        lgas: [
          { name: 'Aninri' }, { name: 'Awgu' }, { name: 'Enugu East' },
          { name: 'Enugu North' }, { name: 'Enugu South' }, { name: 'Ezeagu' },
          { name: 'Igbo Etiti' }, { name: 'Igbo Eze North' }, { name: 'Igbo Eze South' },
          { name: 'Isi Uzo' }, { name: 'Nkanu East' }, { name: 'Nkanu West' },
          { name: 'Nsukka' }, { name: 'Oji River' }, { name: 'Udenu' },
          { name: 'Udi' }, { name: 'Uzo-Uwani' },
        ],
        zones: [
          { name: 'Enugu North' }, { name: 'Enugu South' },
          { name: 'Enugu East' }, { name: 'Nsukka' }, { name: 'Udi' },
        ],
      },
    ];

    for (const stateData of statesData) {
      const state = await State.create(stateData);
      console.log(`✅ State created: ${state.name}`);
      console.log(`  📍 Created ${state.lgas.length} LGAs and ${state.zones.length} zones`);

      // Create state admin (use same password as super admin for consistency)
      const stateAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!@#';
      const hashedStateAdminPassword = await bcrypt.hash(stateAdminPassword, 10);
      
      const stateAdmin = await User.create({
        email: `admin@${stateData.code}.binpay.ng`,
        phone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: hashedStateAdminPassword,
        firstName: state.name,
        lastName: 'Admin',
        role: 'STATE_ADMIN',
        stateCode: state.code,
        isActive: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
      });

      console.log(`  👤 State admin created: ${stateAdmin.email}`);
      console.log(`     Password: ${stateAdminPassword}`);

      // Seed sample addresses for Lagos only (for testing)
      if (state.code === 'lagos') {
        const sampleAddresses = [
          { lga: 'Apapa', address: '123, Apapa Road, Apapa' },
          { lga: 'Apapa', address: '45, Wharf Road, Apapa' },
          { lga: 'Lagos Mainland', address: '78, Herbert Macaulay Street, Yaba' },
          { lga: 'Lagos Mainland', address: '12, Ikorodu Road, Maryland' },
          { lga: 'Ikeja', address: '34, Allen Avenue, Ikeja' },
          { lga: 'Ikeja', address: '56, Awolowo Road, Ikeja GRA' },
          { lga: 'Lagos Island', address: '89, Marina Street, Lagos Island' },
          { lga: 'Surulere', address: '23, Adeniran Ogunsanya Street, Surulere' },
          { lga: 'Eti Osa', address: '67, Admiralty Way, Lekki Phase 1' },
          { lga: 'Eti Osa', address: '90, Adeola Odeku Street, Victoria Island' },
        ];

        for (const addr of sampleAddresses) {
          const binId = await generateBinId(state.code);
          await BinRegistration.create({
            binId,
            userId: stateAdmin._id, // Temporarily assign to state admin
            stateCode: state.code,
            lgaName: addr.lga,
            address: addr.address,
            isActive: true,
          });
        }
        console.log(`  🏠 Created ${sampleAddresses.length} sample addresses for ${state.name}`);
      }
    }

    console.log('🎉 Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
