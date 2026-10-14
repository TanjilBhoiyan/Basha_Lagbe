-- CreateEnum
CREATE TYPE "Facing" AS ENUM ('north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "address" TEXT,
ADD COLUMN     "facing" "Facing";
