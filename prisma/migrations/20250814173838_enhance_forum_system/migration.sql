/*
  Warnings:

  - The `status` column on the `ForumTopic` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."ForumPermission" AS ENUM ('READ', 'WRITE', 'MODERATE', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."TopicStatus" AS ENUM ('ACTIVE', 'MODERATED', 'DELETED', 'LOCKED');

-- CreateEnum
CREATE TYPE "public"."ReplyStatus" AS ENUM ('ACTIVE', 'MODERATED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."ModerationAction" AS ENUM ('APPROVE', 'REJECT', 'HIDE', 'DELETE', 'WARN', 'BAN');

-- AlterTable
ALTER TABLE "public"."ForumPost" ADD COLUMN     "dislikes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "editedBy" TEXT,
ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentReplyId" INTEGER,
ADD COLUMN     "status" "public"."ReplyStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."ForumTopic" ADD COLUMN     "forumId" TEXT,
ADD COLUMN     "isSticky" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastReplyAt" TIMESTAMP(3),
ADD COLUMN     "lastReplyBy" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."TopicStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "public"."Forum" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "topicCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "moderators" INTEGER[],
    "rules" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Forum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ForumUserRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "forumId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" "public"."ForumPermission"[],
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,

    CONSTRAINT "ForumUserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserForumActivity" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "forumId" TEXT NOT NULL,
    "topicCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpiresAt" TIMESTAMP(3),

    CONSTRAINT "UserForumActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ModerationQueue" (
    "id" SERIAL NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" INTEGER NOT NULL,
    "forumId" TEXT,
    "reportedBy" INTEGER[],
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "moderatorId" INTEGER,
    "action" "public"."ModerationAction",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topicId" INTEGER,
    "postId" INTEGER,

    CONSTRAINT "ModerationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Forum_category_idx" ON "public"."Forum"("category");

-- CreateIndex
CREATE INDEX "Forum_isActive_idx" ON "public"."Forum"("isActive");

-- CreateIndex
CREATE INDEX "Forum_order_idx" ON "public"."Forum"("order");

-- CreateIndex
CREATE INDEX "ForumUserRole_userId_idx" ON "public"."ForumUserRole"("userId");

-- CreateIndex
CREATE INDEX "ForumUserRole_forumId_idx" ON "public"."ForumUserRole"("forumId");

-- CreateIndex
CREATE INDEX "ForumUserRole_role_idx" ON "public"."ForumUserRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ForumUserRole_userId_forumId_key" ON "public"."ForumUserRole"("userId", "forumId");

-- CreateIndex
CREATE INDEX "UserForumActivity_userId_idx" ON "public"."UserForumActivity"("userId");

-- CreateIndex
CREATE INDEX "UserForumActivity_forumId_idx" ON "public"."UserForumActivity"("forumId");

-- CreateIndex
CREATE INDEX "UserForumActivity_lastActivity_idx" ON "public"."UserForumActivity"("lastActivity");

-- CreateIndex
CREATE UNIQUE INDEX "UserForumActivity_userId_forumId_key" ON "public"."UserForumActivity"("userId", "forumId");

-- CreateIndex
CREATE INDEX "ModerationQueue_contentType_idx" ON "public"."ModerationQueue"("contentType");

-- CreateIndex
CREATE INDEX "ModerationQueue_contentId_idx" ON "public"."ModerationQueue"("contentId");

-- CreateIndex
CREATE INDEX "ModerationQueue_status_idx" ON "public"."ModerationQueue"("status");

-- CreateIndex
CREATE INDEX "ModerationQueue_createdAt_idx" ON "public"."ModerationQueue"("createdAt");

-- CreateIndex
CREATE INDEX "ForumPost_parentReplyId_idx" ON "public"."ForumPost"("parentReplyId");

-- CreateIndex
CREATE INDEX "ForumPost_status_idx" ON "public"."ForumPost"("status");

-- CreateIndex
CREATE INDEX "ForumTopic_forumId_idx" ON "public"."ForumTopic"("forumId");

-- CreateIndex
CREATE INDEX "ForumTopic_status_idx" ON "public"."ForumTopic"("status");

-- CreateIndex
CREATE INDEX "ForumTopic_isSticky_idx" ON "public"."ForumTopic"("isSticky");

-- CreateIndex
CREATE INDEX "ForumTopic_lastReplyAt_idx" ON "public"."ForumTopic"("lastReplyAt");

-- AddForeignKey
ALTER TABLE "public"."ForumTopic" ADD CONSTRAINT "ForumTopic_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "public"."Forum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumUserRole" ADD CONSTRAINT "ForumUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumUserRole" ADD CONSTRAINT "ForumUserRole_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "public"."Forum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserForumActivity" ADD CONSTRAINT "UserForumActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserForumActivity" ADD CONSTRAINT "UserForumActivity_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "public"."Forum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModerationQueue" ADD CONSTRAINT "ModerationQueue_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "public"."Forum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModerationQueue" ADD CONSTRAINT "ModerationQueue_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."ForumTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModerationQueue" ADD CONSTRAINT "ModerationQueue_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."ForumPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
