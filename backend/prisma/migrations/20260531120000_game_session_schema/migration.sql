-- Drop legacy productivity tables
DROP TABLE IF EXISTS "Task" CASCADE;
DROP TABLE IF EXISTS "Goal" CASCADE;

-- Game session schema
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vibeWeights" JSONB NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionPrompt" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],

    CONSTRAINT "QuestionPrompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SessionPlay" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "swipedLeft" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionPlay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameSession_roomCode_key" ON "GameSession"("roomCode");

ALTER TABLE "SessionPlay" ADD CONSTRAINT "SessionPlay_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionPlay" ADD CONSTRAINT "SessionPlay_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "QuestionPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
