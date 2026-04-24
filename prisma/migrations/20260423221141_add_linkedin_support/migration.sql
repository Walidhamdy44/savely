-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('manual', 'youtube_liked', 'github_starred', 'linkedin_export_import');

-- AlterEnum
ALTER TYPE "Platform" ADD VALUE 'linkedin';

-- AlterTable
ALTER TABLE "SavedPost" ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "sourceType" "SourceType" NOT NULL DEFAULT 'manual';
