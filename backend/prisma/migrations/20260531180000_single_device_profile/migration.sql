-- Drop legacy multiplayer & productivity tables
DROP TABLE IF EXISTS "SessionPlay" CASCADE;
DROP TABLE IF EXISTS "GameSession" CASCADE;
DROP TABLE IF EXISTS "Task" CASCADE;
DROP TABLE IF EXISTS "Goal" CASCADE;
DROP TABLE IF EXISTS "Report" CASCADE;
DROP TABLE IF EXISTS "Friendship" CASCADE;
DROP TABLE IF EXISTS "PromptPlay" CASCADE;
DROP TABLE IF EXISTS "UserProfile" CASCADE;

-- Slim auth user (drop streak / onboarding columns if present)
ALTER TABLE "User" DROP COLUMN IF EXISTS "currentStreak";
ALTER TABLE "User" DROP COLUMN IF EXISTS "lastActiveDate";
ALTER TABLE "User" DROP COLUMN IF EXISTS "onboardingData";

CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vibeWeights" JSONB NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionPrompt" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],

    CONSTRAINT "QuestionPrompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromptPlay" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "swipedLeft" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptPlay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromptPlay" ADD CONSTRAINT "PromptPlay_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromptPlay" ADD CONSTRAINT "PromptPlay_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "QuestionPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
