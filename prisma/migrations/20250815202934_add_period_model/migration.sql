-- AlterTable
ALTER TABLE "public"."Anime" ADD COLUMN     "periodId" INTEGER;

-- CreateTable
CREATE TABLE "public"."Period" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Period_name_key" ON "public"."Period"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Period_slug_key" ON "public"."Period"("slug");

-- CreateIndex
CREATE INDEX "Period_slug_idx" ON "public"."Period"("slug");

-- CreateIndex
CREATE INDEX "Period_startYear_idx" ON "public"."Period"("startYear");

-- CreateIndex
CREATE INDEX "Period_endYear_idx" ON "public"."Period"("endYear");

-- CreateIndex
CREATE INDEX "Period_order_idx" ON "public"."Period"("order");

-- AddForeignKey
ALTER TABLE "public"."Anime" ADD CONSTRAINT "Anime_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "public"."Period"("id") ON DELETE SET NULL ON UPDATE CASCADE;
