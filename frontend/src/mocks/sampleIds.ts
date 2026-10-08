/**
 * Ids of the 7 sample properties created by the backend seed
 * (backend/prisma/seed.ts). Mock features that are not on the backend yet
 * (visits, chat, owner dashboard) use these so they keep working.
 */
export const SAMPLE_PROPERTY_IDS = {
  p1: '00000000-0000-7000-9000-000000000001', // Modern Apartment in Mirpur
  p2: '00000000-0000-7000-9000-000000000002', // Cozy Flat in Dhanmondi
  p3: '00000000-0000-7000-9000-000000000003', // Family House with Parking
  p4: '00000000-0000-7000-9000-000000000004', // Single Room for Students
  p5: '00000000-0000-7000-9000-000000000005', // Sublet Room near Bashundhara
  p6: '00000000-0000-7000-9000-000000000006', // Office Space in Gulshan
  p7: '00000000-0000-7000-9000-000000000007', // Apartment with Hill View
} as const;