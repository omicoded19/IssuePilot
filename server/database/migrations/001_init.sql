CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "githubRepositoryId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT,
    "githubUrl" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "primaryLanguage" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "watchers" INTEGER NOT NULL DEFAULT 0,
    "openIssuesCount" INTEGER NOT NULL DEFAULT 0,
    "license" TEXT,
    "topics" JSONB NOT NULL,
    "repositorySize" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isFork" BOOLEAN NOT NULL DEFAULT false,
    "githubCreatedAt" TIMESTAMP(3) NOT NULL,
    "githubUpdatedAt" TIMESTAMP(3) NOT NULL,
    "githubPushedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RepositoryAnalysis" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "languages" JSONB NOT NULL,
    "technologies" JSONB NOT NULL,
    "rootStructure" JSONB NOT NULL,
    "documents" JSONB NOT NULL,
    "setup" JSONB NOT NULL,
    "contributionReadiness" JSONB NOT NULL,
    "scores" JSONB NOT NULL,
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "analysedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RepositoryAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "githubIssueId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "bodyPreview" TEXT,
    "githubUrl" TEXT NOT NULL,
    "labels" JSONB NOT NULL,
    "state" TEXT NOT NULL,
    "author" TEXT,
    "assignees" JSONB NOT NULL,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "availabilityStatus" TEXT NOT NULL,
    "availabilityExplanation" TEXT NOT NULL,
    "githubCreatedAt" TIMESTAMP(3) NOT NULL,
    "githubUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Repository_githubRepositoryId_key" ON "Repository"("githubRepositoryId");
CREATE UNIQUE INDEX "Repository_fullName_key" ON "Repository"("fullName");
CREATE INDEX "Repository_owner_name_idx" ON "Repository"("owner", "name");
CREATE INDEX "Repository_fullName_idx" ON "Repository"("fullName");
CREATE INDEX "RepositoryAnalysis_repositoryId_analysedAt_idx" ON "RepositoryAnalysis"("repositoryId", "analysedAt");
CREATE UNIQUE INDEX "Issue_githubIssueId_key" ON "Issue"("githubIssueId");
CREATE UNIQUE INDEX "Issue_repositoryId_number_key" ON "Issue"("repositoryId", "number");
CREATE INDEX "Issue_repositoryId_idx" ON "Issue"("repositoryId");
CREATE INDEX "Issue_repositoryId_number_idx" ON "Issue"("repositoryId", "number");
ALTER TABLE "RepositoryAnalysis" ADD CONSTRAINT "RepositoryAnalysis_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
