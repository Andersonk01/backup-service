"use client"

import { useEffect, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { BackupChart } from "@/components/dashboard/backup-chart"
import { RecentRuns } from "@/components/dashboard/recent-runs"
import { StorageCard } from "@/components/dashboard/storage-card"
import { DatabaseList } from "@/components/dashboard/database-list"
import { RunBackupDialog } from "@/components/dialogs/run-backup-dialog"
import { statsApi, runsApi, databasesApi } from "@/lib/api"
import type { DashboardStats, BackupRun, Database } from "@/lib/types"

const mockBackupHistory = [
  { date: '28/04', success: 12, failed: 1 },
  { date: '29/04', success: 14, failed: 0 },
  { date: '30/04', success: 13, failed: 2 },
  { date: '01/05', success: 15, failed: 0 },
  { date: '02/05', success: 14, failed: 1 },
  { date: '03/05', success: 13, failed: 1 },
  { date: '04/05', success: 8, failed: 0 },
]

export default function DashboardPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [backupRuns, setBackupRuns] = useState<BackupRun[]>([])
  const [databasesList, setDatabasesList] = useState<Database[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        await fetch('/api/runs', { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cleanup-stuck' })
        })
        
        await fetch('/api/runs', { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cleanup-missing-files' })
        })

        const [statsData, runsData, dbsData] = await Promise.all([
          statsApi.get(),
          runsApi.getAll(),
          databasesApi.getAll(),
        ])
        setDashboardStats(statsData)
        setBackupRuns(runsData)
        setDatabasesList(dbsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Dashboard" description="Visão geral do sistema de backups" />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  const statsWithDefaults: DashboardStats = dashboardStats || {
    totalDatabases: 0,
    activeDatabases: 0,
    totalBackups: 0,
    successfulBackups: 0,
    failedBackups: 0,
    totalStorage: 0,
    averageBackupTime: 0,
  }

  const storageUsage = databasesList.map(db => ({
    name: db.name,
    size: db.lastBackup ? 5368709120 : 0,
    percentage: 33,
  }))

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Dashboard"
        description="Visão geral do sistema de backups"
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground">
              Aqui está o resumo do seu sistema de backups.
            </p>
          </div>
          <RunBackupDialog onBackupStarted={() => {
            statsApi.get().then(setDashboardStats)
            runsApi.getAll().then(setBackupRuns)
          }} />
        </div>

        <StatsCards stats={statsWithDefaults} />

        <div className="grid gap-6 lg:grid-cols-2">
          <BackupChart data={mockBackupHistory} />
          <RecentRuns runs={backupRuns} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DatabaseList databases={databasesList} />
          </div>
          <StorageCard
            data={storageUsage}
            totalUsed={statsWithDefaults.totalStorage}
          />
        </div>
      </div>
    </div>
  )
}