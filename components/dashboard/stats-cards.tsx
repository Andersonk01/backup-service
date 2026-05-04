"use client"

import {
  Database,
  CheckCircle2,
  XCircle,
  HardDrive,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { DashboardStats } from "@/lib/types"

interface StatsCardsProps {
  stats: DashboardStats
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

export function StatsCards({ stats }: StatsCardsProps) {
  const successRate = stats.totalBackups > 0
    ? ((stats.successfulBackups / stats.totalBackups) * 100).toFixed(1)
    : "0"

  const statItems = [
    {
      name: "Bancos Ativos",
      value: `${stats.activeDatabases}/${stats.totalDatabases}`,
      icon: Database,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      name: "Backups com Sucesso",
      value: stats.successfulBackups.toString(),
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      name: "Backups com Falha",
      value: stats.failedBackups.toString(),
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      name: "Armazenamento Usado",
      value: formatBytes(stats.totalStorage),
      icon: HardDrive,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      name: "Tempo Médio",
      value: formatDuration(stats.averageBackupTime),
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      name: "Taxa de Sucesso",
      value: `${successRate}%`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statItems.map((stat) => (
        <Card key={stat.name} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground truncate">{stat.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
