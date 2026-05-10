-- CreateTable
CREATE TABLE "Database" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "connectionUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastBackup" TIMESTAMP(3),
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "Database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupJob" (
    "id" TEXT NOT NULL,
    "databaseId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextRun" TIMESTAMP(3),

    CONSTRAINT "BackupJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRun" (
    "id" TEXT NOT NULL,
    "databaseId" TEXT NOT NULL,
    "databaseName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "filePath" TEXT,
    "size" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "duration" INTEGER,

    CONSTRAINT "BackupRun_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BackupJob" ADD CONSTRAINT "BackupJob_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRun" ADD CONSTRAINT "BackupRun_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE CASCADE ON UPDATE CASCADE;
