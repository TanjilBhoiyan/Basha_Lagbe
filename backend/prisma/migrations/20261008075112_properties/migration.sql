-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'room', 'house', 'sublet', 'office', 'shop', 'mess');

-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('family', 'bachelor-male', 'bachelor-female', 'student', 'professional');

-- CreateEnum
CREATE TYPE "Furnishing" AS ENUM ('furnished', 'semi-furnished', 'unfurnished');

-- CreateEnum
CREATE TYPE "Amenity" AS ENUM ('wifi', 'parking', 'ac', 'generator', 'lift', 'security', 'cctv', 'gas', 'water', 'balcony', 'fire-safety');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('pending', 'published', 'rented', 'rejected');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "identity_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "image_url" TEXT,
    "popular_rank" INTEGER,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "location_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'pending',
    "area_label" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "monthly_rent" INTEGER NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "advance_months" INTEGER NOT NULL DEFAULT 0,
    "service_charge" INTEGER NOT NULL DEFAULT 0,
    "security_deposit_months" INTEGER NOT NULL DEFAULT 0,
    "utility_included" BOOLEAN NOT NULL DEFAULT false,
    "min_stay_months" INTEGER NOT NULL DEFAULT 0,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "size_sqft" INTEGER NOT NULL,
    "floor_number" INTEGER NOT NULL DEFAULT 0,
    "total_floors" INTEGER NOT NULL DEFAULT 1,
    "tenant_types" "TenantType"[],
    "furnishing" "Furnishing" NOT NULL DEFAULT 'unfurnished',
    "amenities" "Amenity"[],
    "available_from" DATE NOT NULL,
    "video_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","property_id")
);

-- CreateIndex
CREATE INDEX "properties_status_location_id_idx" ON "properties"("status", "location_id");

-- CreateIndex
CREATE INDEX "properties_status_monthly_rent_idx" ON "properties"("status", "monthly_rent");

-- CreateIndex
CREATE INDEX "property_images_property_id_sort_order_idx" ON "property_images"("property_id", "sort_order");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
