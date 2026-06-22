CREATE TABLE "DeveloperProfileAnalysis" (
    "id" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "company" TEXT,
    "blog" TEXT,
    "publicRepos" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "githubCreatedAt" TIMESTAMP(3) NOT NULL,
    "githubUpdatedAt" TIMESTAMP(3) NOT NULL,
    "languages" JSONB NOT NULL,
    "technologies" JSONB NOT NULL,
    "repositories" JSONB NOT NULL,
    "analysisNotes" JSONB NOT NULL,
    "repositoriesAnalysed" INTEGER NOT NULL DEFAULT 0,
    "analysedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeveloperProfileAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeveloperProfileAnalysis_username_analysedAt_idx"
ON "DeveloperProfileAnalysis"("username", "analysedAt");

CREATE INDEX "DeveloperProfileAnalysis_githubUserId_idx"
ON "DeveloperProfileAnalysis"("githubUserId");
