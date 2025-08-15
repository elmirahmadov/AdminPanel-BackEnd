-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "public"."AnimeType" AS ENUM ('TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL');

-- CreateEnum
CREATE TYPE "public"."AnimeStatus" AS ENUM ('ONGOING', 'COMPLETED', 'UPCOMING');

-- CreateEnum
CREATE TYPE "public"."CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('SYSTEM', 'USER', 'ANIME', 'COMMENT', 'FORUM', 'TASK', 'BADGE');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('ANIME', 'COMMENT', 'USER', 'FORUM');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('DAILY', 'WEEKLY', 'SPECIAL');

-- CreateEnum
CREATE TYPE "public"."BadgeType" AS ENUM ('SYSTEM', 'EVENT', 'SPECIAL');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('COMMENT', 'FAVORITE', 'WATCH', 'LOGIN', 'RATING', 'FOLLOW');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "profileImage" TEXT DEFAULT 'default-profile.png',
    "bio" VARCHAR(500),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "twoFactorSecret" TEXT,
    "lastLogin" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserFollow" (
    "id" SERIAL NOT NULL,
    "followerId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Anime" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "releaseYear" INTEGER,
    "type" "public"."AnimeType" NOT NULL,
    "status" "public"."AnimeStatus" NOT NULL DEFAULT 'ONGOING',
    "imageUrl" TEXT DEFAULT 'default-anime.jpg',
    "bannerUrl" TEXT,
    "studios" TEXT[],
    "trailerUrl" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" INTEGER,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnimeGallery" (
    "id" SERIAL NOT NULL,
    "animeId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnimeGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExternalLink" (
    "id" SERIAL NOT NULL,
    "animeId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ExternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Source" (
    "id" SERIAL NOT NULL,
    "animeId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RelatedAnime" (
    "id" SERIAL NOT NULL,
    "mainId" INTEGER NOT NULL,
    "relatedId" INTEGER NOT NULL,
    "relation" TEXT NOT NULL,

    CONSTRAINT "RelatedAnime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Season" (
    "id" SERIAL NOT NULL,
    "animeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "releaseYear" INTEGER,
    "episodeCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Episode" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "animeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT,
    "releaseDate" TIMESTAMP(3),
    "duration" INTEGER,
    "thumbnail" TEXT,
    "videoUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Character" (
    "id" SERIAL NOT NULL,
    "animeId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "voiceActor" TEXT,
    "role" TEXT,
    "age" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "animeId" INTEGER,
    "seasonId" INTEGER,
    "episodeId" INTEGER,
    "parentId" INTEGER,
    "status" "public"."CommentStatus" NOT NULL DEFAULT 'PENDING',
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "dislikesCount" INTEGER NOT NULL DEFAULT 0,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isSpoiler" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "gifUrl" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderatedById" INTEGER,
    "moderationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ForumCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "topicCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ForumTopic" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryLastTopicId" INTEGER,

    CONSTRAINT "ForumTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ForumPost" (
    "id" SERIAL NOT NULL,
    "topicId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "animeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Watchlist" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "animeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rating" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "animeId" INTEGER NOT NULL,
    "value" SMALLINT NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Badge" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."BadgeType" NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "requirement" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBadge" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "badgeId" INTEGER NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."TaskType" NOT NULL,
    "description" TEXT,
    "reward" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserTask" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."View" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "animeId" INTEGER,
    "episodeId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserActivity" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "public"."ActivityType" NOT NULL,
    "refId" INTEGER,
    "refType" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "senderId" INTEGER,
    "animeId" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationSetting" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" SERIAL NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "reportedById" INTEGER NOT NULL,
    "handledById" INTEGER,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animeId" INTEGER,
    "commentId" INTEGER,
    "targetUserId" INTEGER,
    "forumPostId" INTEGER,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBanHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "bannedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserBanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnimeTranslation" (
    "id" SERIAL NOT NULL,
    "animeId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "AnimeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CategoryTranslation" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnimeHistory" (
    "id" SERIAL NOT NULL,
    "animeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_AnimeCategory" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AnimeCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AnimeTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AnimeTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "UserFollow_followerId_idx" ON "public"."UserFollow"("followerId");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_idx" ON "public"."UserFollow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "public"."UserFollow"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Anime_slug_key" ON "public"."Anime"("slug");

-- CreateIndex
CREATE INDEX "Anime_slug_idx" ON "public"."Anime"("slug");

-- CreateIndex
CREATE INDEX "Anime_status_idx" ON "public"."Anime"("status");

-- CreateIndex
CREATE INDEX "Anime_type_idx" ON "public"."Anime"("type");

-- CreateIndex
CREATE INDEX "Anime_featured_idx" ON "public"."Anime"("featured");

-- CreateIndex
CREATE INDEX "Anime_rating_idx" ON "public"."Anime"("rating");

-- CreateIndex
CREATE INDEX "Anime_viewCount_idx" ON "public"."Anime"("viewCount");

-- CreateIndex
CREATE INDEX "Anime_createdAt_idx" ON "public"."Anime"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "public"."Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "public"."Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_order_idx" ON "public"."Category"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "public"."Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_slug_idx" ON "public"."Tag"("slug");

-- CreateIndex
CREATE INDEX "AnimeGallery_animeId_idx" ON "public"."AnimeGallery"("animeId");

-- CreateIndex
CREATE INDEX "AnimeGallery_order_idx" ON "public"."AnimeGallery"("order");

-- CreateIndex
CREATE INDEX "ExternalLink_animeId_idx" ON "public"."ExternalLink"("animeId");

-- CreateIndex
CREATE INDEX "Source_animeId_idx" ON "public"."Source"("animeId");

-- CreateIndex
CREATE INDEX "RelatedAnime_mainId_idx" ON "public"."RelatedAnime"("mainId");

-- CreateIndex
CREATE INDEX "RelatedAnime_relatedId_idx" ON "public"."RelatedAnime"("relatedId");

-- CreateIndex
CREATE UNIQUE INDEX "RelatedAnime_mainId_relatedId_key" ON "public"."RelatedAnime"("mainId", "relatedId");

-- CreateIndex
CREATE INDEX "Season_animeId_idx" ON "public"."Season"("animeId");

-- CreateIndex
CREATE INDEX "Season_slug_idx" ON "public"."Season"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Season_animeId_number_key" ON "public"."Season"("animeId", "number");

-- CreateIndex
CREATE INDEX "Episode_animeId_idx" ON "public"."Episode"("animeId");

-- CreateIndex
CREATE INDEX "Episode_slug_idx" ON "public"."Episode"("slug");

-- CreateIndex
CREATE INDEX "Episode_releaseDate_idx" ON "public"."Episode"("releaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_number_key" ON "public"."Episode"("seasonId", "number");

-- CreateIndex
CREATE INDEX "Character_animeId_idx" ON "public"."Character"("animeId");

-- CreateIndex
CREATE INDEX "Character_name_idx" ON "public"."Character"("name");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "public"."Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_animeId_idx" ON "public"."Comment"("animeId");

-- CreateIndex
CREATE INDEX "Comment_seasonId_idx" ON "public"."Comment"("seasonId");

-- CreateIndex
CREATE INDEX "Comment_episodeId_idx" ON "public"."Comment"("episodeId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "public"."Comment"("parentId");

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "public"."Comment"("status");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "public"."Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_moderatedAt_idx" ON "public"."Comment"("moderatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategory_name_key" ON "public"."ForumCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategory_slug_key" ON "public"."ForumCategory"("slug");

-- CreateIndex
CREATE INDEX "ForumCategory_slug_idx" ON "public"."ForumCategory"("slug");

-- CreateIndex
CREATE INDEX "ForumCategory_parentId_idx" ON "public"."ForumCategory"("parentId");

-- CreateIndex
CREATE INDEX "ForumCategory_order_idx" ON "public"."ForumCategory"("order");

-- CreateIndex
CREATE UNIQUE INDEX "ForumTopic_slug_key" ON "public"."ForumTopic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ForumTopic_categoryLastTopicId_key" ON "public"."ForumTopic"("categoryLastTopicId");

-- CreateIndex
CREATE INDEX "ForumTopic_slug_idx" ON "public"."ForumTopic"("slug");

-- CreateIndex
CREATE INDEX "ForumTopic_userId_idx" ON "public"."ForumTopic"("userId");

-- CreateIndex
CREATE INDEX "ForumTopic_categoryId_idx" ON "public"."ForumTopic"("categoryId");

-- CreateIndex
CREATE INDEX "ForumTopic_status_idx" ON "public"."ForumTopic"("status");

-- CreateIndex
CREATE INDEX "ForumTopic_isPinned_idx" ON "public"."ForumTopic"("isPinned");

-- CreateIndex
CREATE INDEX "ForumTopic_createdAt_idx" ON "public"."ForumTopic"("createdAt");

-- CreateIndex
CREATE INDEX "ForumPost_topicId_idx" ON "public"."ForumPost"("topicId");

-- CreateIndex
CREATE INDEX "ForumPost_userId_idx" ON "public"."ForumPost"("userId");

-- CreateIndex
CREATE INDEX "ForumPost_createdAt_idx" ON "public"."ForumPost"("createdAt");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "public"."Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_animeId_idx" ON "public"."Favorite"("animeId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_animeId_key" ON "public"."Favorite"("userId", "animeId");

-- CreateIndex
CREATE INDEX "Watchlist_userId_idx" ON "public"."Watchlist"("userId");

-- CreateIndex
CREATE INDEX "Watchlist_animeId_idx" ON "public"."Watchlist"("animeId");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_animeId_key" ON "public"."Watchlist"("userId", "animeId");

-- CreateIndex
CREATE INDEX "Rating_animeId_idx" ON "public"."Rating"("animeId");

-- CreateIndex
CREATE INDEX "Rating_value_idx" ON "public"."Rating"("value");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_animeId_key" ON "public"."Rating"("userId", "animeId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_name_key" ON "public"."Badge"("name");

-- CreateIndex
CREATE INDEX "Badge_type_idx" ON "public"."Badge"("type");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "public"."UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_earnedAt_idx" ON "public"."UserBadge"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "public"."UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "Task_type_idx" ON "public"."Task"("type");

-- CreateIndex
CREATE INDEX "Task_isActive_idx" ON "public"."Task"("isActive");

-- CreateIndex
CREATE INDEX "UserTask_userId_idx" ON "public"."UserTask"("userId");

-- CreateIndex
CREATE INDEX "UserTask_completedAt_idx" ON "public"."UserTask"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_userId_taskId_key" ON "public"."UserTask"("userId", "taskId");

-- CreateIndex
CREATE INDEX "View_userId_idx" ON "public"."View"("userId");

-- CreateIndex
CREATE INDEX "View_animeId_idx" ON "public"."View"("animeId");

-- CreateIndex
CREATE INDEX "View_episodeId_idx" ON "public"."View"("episodeId");

-- CreateIndex
CREATE INDEX "View_createdAt_idx" ON "public"."View"("createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_idx" ON "public"."UserActivity"("userId");

-- CreateIndex
CREATE INDEX "UserActivity_type_idx" ON "public"."UserActivity"("type");

-- CreateIndex
CREATE INDEX "UserActivity_createdAt_idx" ON "public"."UserActivity"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_type_key" ON "public"."NotificationSetting"("userId", "type");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "public"."Report"("type");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "Report_reportedById_idx" ON "public"."Report"("reportedById");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");

-- CreateIndex
CREATE INDEX "UserBanHistory_userId_idx" ON "public"."UserBanHistory"("userId");

-- CreateIndex
CREATE INDEX "UserBanHistory_expiresAt_idx" ON "public"."UserBanHistory"("expiresAt");

-- CreateIndex
CREATE INDEX "AnimeTranslation_language_idx" ON "public"."AnimeTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeTranslation_animeId_language_key" ON "public"."AnimeTranslation"("animeId", "language");

-- CreateIndex
CREATE INDEX "CategoryTranslation_language_idx" ON "public"."CategoryTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_language_key" ON "public"."CategoryTranslation"("categoryId", "language");

-- CreateIndex
CREATE INDEX "AnimeHistory_animeId_idx" ON "public"."AnimeHistory"("animeId");

-- CreateIndex
CREATE INDEX "AnimeHistory_userId_idx" ON "public"."AnimeHistory"("userId");

-- CreateIndex
CREATE INDEX "AnimeHistory_action_idx" ON "public"."AnimeHistory"("action");

-- CreateIndex
CREATE INDEX "AnimeHistory_createdAt_idx" ON "public"."AnimeHistory"("createdAt");

-- CreateIndex
CREATE INDEX "_AnimeCategory_B_index" ON "public"."_AnimeCategory"("B");

-- CreateIndex
CREATE INDEX "_AnimeTags_B_index" ON "public"."_AnimeTags"("B");

-- AddForeignKey
ALTER TABLE "public"."UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Anime" ADD CONSTRAINT "Anime_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Anime" ADD CONSTRAINT "Anime_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnimeGallery" ADD CONSTRAINT "AnimeGallery_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalLink" ADD CONSTRAINT "ExternalLink_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Source" ADD CONSTRAINT "Source_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RelatedAnime" ADD CONSTRAINT "RelatedAnime_mainId_fkey" FOREIGN KEY ("mainId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RelatedAnime" ADD CONSTRAINT "RelatedAnime_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Season" ADD CONSTRAINT "Season_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Episode" ADD CONSTRAINT "Episode_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Character" ADD CONSTRAINT "Character_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "public"."Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumCategory" ADD CONSTRAINT "ForumCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ForumCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumTopic" ADD CONSTRAINT "ForumTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumTopic" ADD CONSTRAINT "ForumTopic_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ForumCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumTopic" ADD CONSTRAINT "ForumTopic_categoryLastTopicId_fkey" FOREIGN KEY ("categoryLastTopicId") REFERENCES "public"."ForumCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumPost" ADD CONSTRAINT "ForumPost_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."ForumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumPost" ADD CONSTRAINT "ForumPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Watchlist" ADD CONSTRAINT "Watchlist_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rating" ADD CONSTRAINT "Rating_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTask" ADD CONSTRAINT "UserTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTask" ADD CONSTRAINT "UserTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "public"."Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationSetting" ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_forumPostId_fkey" FOREIGN KEY ("forumPostId") REFERENCES "public"."ForumPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBanHistory" ADD CONSTRAINT "UserBanHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBanHistory" ADD CONSTRAINT "UserBanHistory_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnimeTranslation" ADD CONSTRAINT "AnimeTranslation_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnimeHistory" ADD CONSTRAINT "AnimeHistory_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnimeHistory" ADD CONSTRAINT "AnimeHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AnimeCategory" ADD CONSTRAINT "_AnimeCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AnimeCategory" ADD CONSTRAINT "_AnimeCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AnimeTags" ADD CONSTRAINT "_AnimeTags_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AnimeTags" ADD CONSTRAINT "_AnimeTags_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
