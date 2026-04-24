/*
  Warnings:

  - The values [linkedin_export_import] on the enum `SourceType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[userId,url]` on the table `SavedPost` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SourceType_new" AS ENUM ('manual', 'extension', 'youtube_liked', 'github_starred');
ALTER TABLE "public"."SavedPost" ALTER COLUMN "sourceType" DROP DEFAULT;
ALTER TABLE "SavedPost" ALTER COLUMN "sourceType" TYPE "SourceType_new" USING ("sourceType"::text::"SourceType_new");
ALTER TYPE "SourceType" RENAME TO "SourceType_old";
ALTER TYPE "SourceType_new" RENAME TO "SourceType";
DROP TYPE "public"."SourceType_old";
ALTER TABLE "SavedPost" ALTER COLUMN "sourceType" SET DEFAULT 'manual';
COMMIT;

-- AlterTable
ALTER TABLE "SavedPost" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "lastUsed" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_token_key" ON "ApiToken"("token");

-- CreateIndex
CREATE INDEX "ApiToken_userId_idx" ON "ApiToken"("userId");

-- CreateIndex
CREATE INDEX "ApiToken_token_idx" ON "ApiToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPost_userId_url_key" ON "SavedPost"("userId", "url");

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
