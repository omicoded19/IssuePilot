CREATE TABLE "ContributionWorkspace" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "issueNumber" INTEGER NOT NULL,
    "workspace" JSONB NOT NULL,
    "progress" JSONB NOT NULL,
    "personalNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContributionWorkspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContributionWorkspace_user_repository_issue_key"
ON "ContributionWorkspace"("username", "repositoryId", "issueNumber");

CREATE INDEX "ContributionWorkspace_username_updatedAt_idx"
ON "ContributionWorkspace"("username", "updatedAt");

CREATE INDEX "ContributionWorkspace_repositoryId_issueNumber_idx"
ON "ContributionWorkspace"("repositoryId", "issueNumber");

ALTER TABLE "ContributionWorkspace"
ADD CONSTRAINT "ContributionWorkspace_repositoryId_fkey"
FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
