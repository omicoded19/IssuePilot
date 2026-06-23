CREATE TABLE "PerformanceBenchmark" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repository" TEXT NOT NULL,
    "coldDurationMs" DOUBLE PRECISION NOT NULL,
    "warmDurationMs" DOUBLE PRECISION NOT NULL,
    "latencyReductionPercent" DOUBLE PRECISION NOT NULL,
    "coldGitHubRequests" INTEGER NOT NULL,
    "warmGitHubRequests" INTEGER NOT NULL,
    "githubRequestReductionPercent" DOUBLE PRECISION NOT NULL,
    "cacheBackend" TEXT NOT NULL,
    "cacheTtlSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PerformanceBenchmark_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PerformanceBenchmark_authUserId_createdAt_idx"
ON "PerformanceBenchmark"("authUserId", "createdAt");

CREATE INDEX "PerformanceBenchmark_owner_repository_createdAt_idx"
ON "PerformanceBenchmark"("owner", "repository", "createdAt");

ALTER TABLE "PerformanceBenchmark"
ADD CONSTRAINT "PerformanceBenchmark_authUserId_fkey"
FOREIGN KEY ("authUserId") REFERENCES "AuthUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
