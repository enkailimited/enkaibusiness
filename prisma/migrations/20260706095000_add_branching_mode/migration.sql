-- CreateEnum
CREATE TYPE "BranchingMode" AS ENUM ('SHARED', 'ISOLATED');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "branching_mode" "BranchingMode" NOT NULL DEFAULT 'ISOLATED';

