CREATE TABLE "RecommendationRun" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "requestProfile" JSONB NOT NULL,
    "organizations" JSONB NOT NULL,
    "repositories" JSONB NOT NULL,
    "candidateRepositoriesChecked" INTEGER NOT NULL DEFAULT 0,
    "repositoriesReturned" INTEGER NOT NULL DEFAULT 0,
    "organizationsReturned" INTEGER NOT NULL DEFAULT 0,
    "scoringVersion" TEXT NOT NULL,
    "notes" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecommendationRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecommendationRun_username_generatedAt_idx"
ON "RecommendationRun"("username", "generatedAt");
