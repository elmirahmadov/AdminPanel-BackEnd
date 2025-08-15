-- DropForeignKey
ALTER TABLE "public"."ForumTopic" DROP CONSTRAINT "ForumTopic_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."ForumTopic" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."ForumTopic" ADD CONSTRAINT "ForumTopic_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ForumCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
