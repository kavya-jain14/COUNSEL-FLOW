-- CreateTable
CREATE TABLE "ReferenceOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canonicalOptionId" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "datasetVersion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LockedStrategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strategyHash" TEXT NOT NULL,
    "datasetVersion" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "profileJson" JSONB NOT NULL,
    "strategyJson" JSONB NOT NULL,
    "auditJson" JSONB NOT NULL,
    "acknowledgementsJson" JSONB NOT NULL,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceOption_canonicalOptionId_key" ON "ReferenceOption"("canonicalOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "LockedStrategy_strategyHash_key" ON "LockedStrategy"("strategyHash");
