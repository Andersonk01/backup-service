"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle2, XCircle, Loader2, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { BackupRun, BackupStatus } from "@/lib/types"

interface RecentRunsProps {
  runs: BackupRun[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function getStatusConfig(status: BackupStatus) {
  switch (status) {
    case "success":
      return {
        icon: CheckCircle2,
        label: "Sucesso",
        variant: "default" as const,
        className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
      }
    case "failed":
      return {
        icon: XCircle,
        label: "Falha",
        variant: "destructive" as const,
        className: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
      }
    case "running":
      return {
        icon: Loader2,
        label: "Executando",
        variant: "secondary" as const,
        className: "bg-info/10 text-info hover:bg-info/20 border-info/20",
      }
    case "pending":
      return {
        icon: Clock,
        label: "Pendente",
        variant: "secondary" as const,
        className: "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20",
      }
  }
}

export function RecentRuns({ runs }: RecentRunsProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Execuções Recentes</CardTitle>
          <CardDescription>Últimos backups executados</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-primary">
          Ver todos
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {runs.slice(0, 6).map((run) => {
            const statusConfig = getStatusConfig(run.status)
            const StatusIcon = statusConfig.icon

            return (
              <div
                key={run.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusIcon
                    className={`h-5 w-5 shrink-0 ${
                      run.status === "success"
                        ? "text-success"
                        : run.status === "failed"
                        ? "text-destructive"
                        : run.status === "running"
                        ? "text-info animate-spin"
                        : "text-warning"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {run.databaseName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(run.startedAt, {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {run.size && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {formatBytes(run.size)}
                    </span>
                  )}
                  <Badge variant="outline" className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
