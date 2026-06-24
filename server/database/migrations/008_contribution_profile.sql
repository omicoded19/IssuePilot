CREATE TABLE "ContributionProfile" (
    "authUserId" TEXT NOT NULL,
    "skills" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "contributionPreferences" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "availability" JSONB NOT NULL,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContributionProfile_pkey" PRIMARY KEY ("authUserId")
);

ALTER TABLE "ContributionProfile"
ADD CONSTRAINT "ContributionProfile_authUserId_fkey"
FOREIGN KEY ("authUserId") REFERENCES "AuthUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
