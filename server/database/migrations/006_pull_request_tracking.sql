CREATE TABLE "PullRequestTracking" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "githubPullRequestId" TEXT NOT NULL,
    "pullRequestNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "reviewDecision" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PullRequestTracking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PullRequestTracking_workspaceId_key"
ON "PullRequestTracking"("workspaceId");

CREATE UNIQUE INDEX "PullRequestTracking_githubPullRequestId_key"
ON "PullRequestTracking"("githubPullRequestId");

CREATE INDEX "PullRequestTracking_authUserId_status_idx"
ON "PullRequestTracking"("authUserId", "status");

CREATE INDEX "PullRequestTracking_lastSyncedAt_idx"
ON "PullRequestTracking"("lastSyncedAt");

ALTER TABLE "PullRequestTracking"
ADD CONSTRAINT "PullRequestTracking_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "ContributionWorkspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PullRequestTracking"
ADD CONSTRAINT "PullRequestTracking_authUserId_fkey"
FOREIGN KEY ("authUserId") REFERENCES "AuthUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
