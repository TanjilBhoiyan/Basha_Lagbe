/**
 * Sample data for local development: locations, 7 owners and 7 properties
 * (the same ones the app used as mock data).
 *
 * Run:  npx prisma db seed
 * Safe to run again — existing rows are updated, not duplicated.
 */
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

import { PrismaClient, type Prisma } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

/** Every sample owner can log in with this password. */
const OWNER_PASSWORD = 'Owner@1234';

const LOCATIONS: Prisma.LocationCreateInput[] = [
  { id: 'dhaka-mirpur', name: 'Mirpur', city: 'Dhaka', latitude: 23.8223, longitude: 90.3654, imageUrl: '/static/locations/mirpur.jpg', popularRank: 1 },
  { id: 'dhaka-uttara', name: 'Uttara', city: 'Dhaka', latitude: 23.8759, longitude: 90.3795, imageUrl: '/static/locations/uttara.jpg', popularRank: 2 },
  { id: 'dhaka-dhanmondi', name: 'Dhanmondi', city: 'Dhaka', latitude: 23.7461, longitude: 90.3742, imageUrl: '/static/locations/dhanmondi.jpg', popularRank: 3 },
  { id: 'dhaka-bashundhara', name: 'Bashundhara', city: 'Dhaka', latitude: 23.8193, longitude: 90.4526, imageUrl: '/static/locations/bashundhara.jpg', popularRank: 4 },
  { id: 'chattogram', name: 'Chattogram', city: 'Chattogram', latitude: 22.3569, longitude: 91.7832, imageUrl: '/static/locations/chattogram.jpg', popularRank: 5 },
  { id: 'sylhet', name: 'Sylhet', city: 'Sylhet', latitude: 24.8949, longitude: 91.8687, imageUrl: '/static/locations/sylhet.jpg', popularRank: 6 },
  { id: 'dhaka-mohammadpur', name: 'Mohammadpur', city: 'Dhaka', latitude: 23.7662, longitude: 90.3589 },
  { id: 'dhaka-badda', name: 'Badda', city: 'Dhaka', latitude: 23.7808, longitude: 90.4267 },
  { id: 'dhaka-banani', name: 'Banani', city: 'Dhaka', latitude: 23.7937, longitude: 90.4066 },
  { id: 'dhaka-gulshan', name: 'Gulshan', city: 'Dhaka', latitude: 23.7925, longitude: 90.4078 },
  { id: 'dhaka-rampura', name: 'Rampura', city: 'Dhaka', latitude: 23.7613, longitude: 90.421 },
  { id: 'dhaka-motijheel', name: 'Motijheel', city: 'Dhaka', latitude: 23.733, longitude: 90.4172 },
  { id: 'rajshahi', name: 'Rajshahi', city: 'Rajshahi', latitude: 24.3745, longitude: 88.6042 },
  { id: 'khulna', name: 'Khulna', city: 'Khulna', latitude: 22.8456, longitude: 89.5403 },
];

/** Fixed ids so running the seed twice updates instead of duplicating. */
const OWNERS = [
  { id: '00000000-0000-7000-8000-000000000001', fullName: 'Md. Rahman', phone: '1711000001', email: 'owner1@bashalagbe.test', identityVerified: true, createdAt: new Date('2023-01-10') },
  { id: '00000000-0000-7000-8000-000000000002', fullName: 'Nasrin Akter', phone: '1711000002', email: 'owner2@bashalagbe.test', identityVerified: true, createdAt: new Date('2022-06-05') },
  { id: '00000000-0000-7000-8000-000000000003', fullName: 'Kamal Hossain', phone: '1711000003', email: 'owner3@bashalagbe.test', identityVerified: false, createdAt: new Date('2021-11-20') },
  { id: '00000000-0000-7000-8000-000000000004', fullName: 'Rahima Begum', phone: '1711000004', email: 'owner4@bashalagbe.test', identityVerified: true, createdAt: new Date('2024-03-02') },
  { id: '00000000-0000-7000-8000-000000000005', fullName: 'Sajid Ahmed', phone: '1711000005', email: 'owner5@bashalagbe.test', identityVerified: false, createdAt: new Date('2024-08-15') },
  { id: '00000000-0000-7000-8000-000000000006', fullName: 'Tanvir Islam', phone: '1711000006', email: 'owner6@bashalagbe.test', identityVerified: true, createdAt: new Date('2022-02-11') },
  { id: '00000000-0000-7000-8000-000000000007', fullName: 'Faruk Chowdhury', phone: '1711000007', email: 'owner7@bashalagbe.test', identityVerified: true, createdAt: new Date('2023-09-01') },
];

const img = {
  living: '/static/properties/living-room.jpg',
  bedroom: '/static/properties/bedroom.jpg',
  building: '/static/properties/building.jpg',
  single: '/static/properties/single-room.jpg',
  kitchen: '/static/properties/kitchen.jpg',
  office: '/static/properties/office.jpg',
};

type SeedProperty = Omit<Prisma.PropertyUncheckedCreateInput, 'images'> & { id: string; images: string[] };

const PROPERTIES: SeedProperty[] = [
  {
    id: '00000000-0000-7000-9000-000000000001',
    ownerId: OWNERS[0].id,
    locationId: 'dhaka-mirpur',
    title: 'Modern Apartment in Mirpur',
    type: 'apartment',
    status: 'published',
    areaLabel: 'Mirpur 10, Dhaka',
    latitude: 23.8069,
    longitude: 90.3687,
    monthlyRent: 28000,
    negotiable: false,
    advanceMonths: 2,
    serviceCharge: 1500,
    securityDepositMonths: 0,
    utilityIncluded: false,
    minStayMonths: 12,
    bedrooms: 3,
    bathrooms: 2,
    sizeSqft: 1250,
    floorNumber: 5,
    totalFloors: 9,
    description:
      'A bright 3-bedroom apartment in the heart of Mirpur 10, a few minutes from the metro station. Good natural light, cross ventilation and a quiet building. Ideal for families or working professionals.',
    tenantTypes: ['family', 'professional'],
    furnishing: 'semi_furnished',
    amenities: ['wifi', 'generator', 'lift', 'gas', 'water', 'balcony', 'cctv', 'fire_safety'],
    availableFrom: new Date('2026-11-01'),
    isVerified: true,
    images: [img.living, img.bedroom, img.kitchen, img.building],
  },
  {
    id: '00000000-0000-7000-9000-000000000002',
    ownerId: OWNERS[1].id,
    locationId: 'dhaka-dhanmondi',
    title: 'Cozy Flat in Dhanmondi',
    type: 'apartment',
    status: 'published',
    areaLabel: 'Dhanmondi, Dhaka',
    latitude: 23.7465,
    longitude: 90.376,
    monthlyRent: 35000,
    negotiable: true,
    advanceMonths: 2,
    serviceCharge: 2500,
    securityDepositMonths: 2,
    utilityIncluded: false,
    minStayMonths: 12,
    bedrooms: 3,
    bathrooms: 2,
    sizeSqft: 1400,
    floorNumber: 4,
    totalFloors: 7,
    description:
      'Fully furnished family flat near Dhanmondi Lake. Comes with AC in the master bedroom, a modern kitchen and a covered parking spot. Close to schools, hospitals and shopping.',
    tenantTypes: ['family'],
    furnishing: 'furnished',
    amenities: ['wifi', 'ac', 'generator', 'lift', 'security', 'parking', 'water', 'balcony', 'cctv', 'fire_safety'],
    availableFrom: new Date('2026-10-15'),
    isVerified: true,
    images: [img.bedroom, img.living, img.kitchen, img.building],
  },
  {
    id: '00000000-0000-7000-9000-000000000003',
    ownerId: OWNERS[2].id,
    locationId: 'dhaka-uttara',
    title: 'Family House with Parking',
    type: 'house',
    status: 'published',
    areaLabel: 'Uttara Sector 7, Dhaka',
    latitude: 23.869,
    longitude: 90.396,
    monthlyRent: 45000,
    negotiable: true,
    advanceMonths: 3,
    serviceCharge: 0,
    securityDepositMonths: 2,
    utilityIncluded: false,
    minStayMonths: 24,
    bedrooms: 4,
    bathrooms: 3,
    sizeSqft: 2100,
    floorNumber: 2,
    totalFloors: 3,
    description:
      'Independent family house with private parking and a small rooftop garden. Spacious rooms, separate dining area and a calm residential neighbourhood in Uttara.',
    tenantTypes: ['family'],
    furnishing: 'unfurnished',
    amenities: ['parking', 'gas', 'water', 'security', 'balcony'],
    availableFrom: new Date('2026-12-01'),
    isVerified: false,
    images: [img.building, img.living, img.kitchen],
  },
  {
    id: '00000000-0000-7000-9000-000000000004',
    ownerId: OWNERS[3].id,
    locationId: 'dhaka-mirpur',
    title: 'Single Room for Students',
    type: 'room',
    status: 'published',
    areaLabel: 'Mirpur 2, Dhaka',
    latitude: 23.8113,
    longitude: 90.356,
    monthlyRent: 8000,
    negotiable: false,
    advanceMonths: 1,
    serviceCharge: 0,
    securityDepositMonths: 0,
    utilityIncluded: true,
    minStayMonths: 6,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqft: 180,
    floorNumber: 3,
    totalFloors: 5,
    description:
      'Furnished single room for a male student or bachelor. Bed, study table, chair and WiFi included. Shared kitchen. Walking distance to Mirpur 2 bus stop.',
    tenantTypes: ['student', 'bachelor_male'],
    furnishing: 'furnished',
    amenities: ['wifi', 'water'],
    availableFrom: new Date('2026-10-10'),
    isVerified: true,
    images: [img.single, img.kitchen],
  },
  {
    id: '00000000-0000-7000-9000-000000000005',
    ownerId: OWNERS[4].id,
    locationId: 'dhaka-bashundhara',
    title: 'Sublet Room near Bashundhara',
    type: 'sublet',
    status: 'published',
    areaLabel: 'Bashundhara R/A, Dhaka',
    latitude: 23.815,
    longitude: 90.43,
    monthlyRent: 12000,
    negotiable: true,
    advanceMonths: 1,
    serviceCharge: 500,
    securityDepositMonths: 1,
    utilityIncluded: true,
    minStayMonths: 6,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqft: 220,
    floorNumber: 6,
    totalFloors: 10,
    description:
      'Sublet room in a shared family apartment, suitable for a female student or professional. Lift and generator backup. Near North South University.',
    tenantTypes: ['bachelor_female', 'student', 'professional'],
    furnishing: 'semi_furnished',
    amenities: ['wifi', 'lift', 'generator', 'water', 'cctv'],
    availableFrom: new Date('2026-11-01'),
    isVerified: false,
    images: [img.single, img.living],
  },
  {
    id: '00000000-0000-7000-9000-000000000006',
    ownerId: OWNERS[5].id,
    locationId: 'dhaka-gulshan',
    title: 'Office Space in Gulshan',
    type: 'office',
    status: 'published',
    areaLabel: 'Gulshan 1, Dhaka',
    latitude: 23.7808,
    longitude: 90.4167,
    monthlyRent: 90000,
    negotiable: true,
    advanceMonths: 3,
    serviceCharge: 8000,
    securityDepositMonths: 3,
    utilityIncluded: false,
    minStayMonths: 24,
    bedrooms: 0,
    bathrooms: 2,
    sizeSqft: 1800,
    floorNumber: 8,
    totalFloors: 12,
    description:
      'Ready office space in Gulshan 1 with workstations, a meeting room, central AC and 24/7 security. Suitable for a 15–20 person team.',
    tenantTypes: ['professional'],
    furnishing: 'furnished',
    amenities: ['wifi', 'ac', 'generator', 'lift', 'security', 'parking', 'cctv', 'fire_safety'],
    availableFrom: new Date('2026-10-20'),
    isVerified: true,
    images: [img.office, img.building],
  },
  {
    id: '00000000-0000-7000-9000-000000000007',
    ownerId: OWNERS[6].id,
    locationId: 'chattogram',
    title: 'Apartment with Hill View',
    type: 'apartment',
    status: 'published',
    areaLabel: 'Khulshi, Chattogram',
    latitude: 22.3604,
    longitude: 91.8014,
    monthlyRent: 22000,
    negotiable: false,
    advanceMonths: 2,
    serviceCharge: 1000,
    securityDepositMonths: 1,
    utilityIncluded: false,
    minStayMonths: 12,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqft: 1050,
    floorNumber: 3,
    totalFloors: 6,
    description:
      '2-bedroom apartment in Khulshi with a lovely hill view from the balcony. Gas line connection and parking available.',
    tenantTypes: ['family', 'professional'],
    furnishing: 'unfurnished',
    amenities: ['gas', 'water', 'balcony', 'parking'],
    availableFrom: new Date('2026-11-01'),
    isVerified: true,
    images: [img.living, img.bedroom],
  },
];

async function main() {
  for (const location of LOCATIONS) {
    await prisma.location.upsert({ where: { id: location.id }, create: location, update: location });
  }
  console.log(`✔ ${LOCATIONS.length} locations`);

  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 10);
  for (const owner of OWNERS) {
    const data = { ...owner, passwordHash, phoneVerified: true };
    await prisma.user.upsert({ where: { id: owner.id }, create: data, update: data });
  }
  console.log(`✔ ${OWNERS.length} owners (password: ${OWNER_PASSWORD})`);

  for (const { images, ...property } of PROPERTIES) {
    await prisma.property.upsert({ where: { id: property.id }, create: property, update: property });
    // Replace the photo list so re-running doesn't add duplicates.
    await prisma.propertyImage.deleteMany({ where: { propertyId: property.id } });
    await prisma.propertyImage.createMany({
      data: images.map((url, sortOrder) => ({ propertyId: property.id, url, sortOrder })),
    });
  }
  console.log(`✔ ${PROPERTIES.length} properties`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());