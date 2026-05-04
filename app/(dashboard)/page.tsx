"use client"

import { AppHeader } from "@/components/app-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { BackupChart } from "@/components/dashboard/backup-chart"
import { RecentRuns } from "@/components/dashboard/recent-runs"
import { StorageCard } from "@/components/dashboard/storage-card"
import { DatabaseList } from "@/components/dashboard/database-list"
import { RunBackupDialog } from "@/components/dialogs/run-backup-dialog"
import {
  mockDashboardStats,
  mockBackupHistory,
  mockBackupRuns,
  mockStorageUsage,
  mockDatabases,
} from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Dashboard"
        description="Visão geral do sistema de backups"
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground">
              Aqui está o resumo do seu sistema de backups.
            </p>
          </div>
          <RunBackupDialog />
        </div>

        {/* Stats */}
        <StatsCards stats={mockDashboardStats} />

        {/* Charts and Recent */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BackupChart data={mockBackupHistory} />
          <RecentRuns runs={mockBackupRuns} />
        </div>

        {/* Databases and Storage */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DatabaseList databases={mockDatabases} />
          </div>
          <StorageCard
            data={mockStorageUsage}
            totalUsed={mockDashboardStats.totalStorage}
          />
        </div>
      </div>
    </div>
  )
}
