/*
  Warnings:

  - A unique constraint covering the columns `[socialId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "socialId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_socialId_key" ON "User"("socialId");
