"use client"

import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Calendar,
  Clock,
  MoreVertical,
  Play,
  Pause,
  Settings,
  Trash2,
  Plus,
  RefreshCw,
} from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { mockBackupJobs, mockDatabases } from "@/lib/mock-data"

const frequencyLabels = {
  hourly: "A cada hora",
  daily: "Diário",
  weekly: "Semanal",
}

const frequencyColors = {
  hourly: "bg-info/10 text-info border-info/20",
  daily: "bg-primary/10 text-primary border-primary/20",
  weekly: "bg-warning/10 text-warning border-warning/20",
}

export default function JobsPage() {
  const [jobs, setJobs] = useState(mockBackupJobs)

  const getDatabaseName = (databaseId: string) => {
    return mockDatabases.find((db) => db.id === databaseId)?.name || "Desconhecido"
  }

  const handleToggleJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, isActive: !job.isActive } : job
      )
    )
    const job = jobs.find((j) => j.id === jobId)
    toast.success(
      job?.isActive
        ? `Job de ${getDatabaseName(job.databaseId)} desativado`
        : `Job de ${getDatabaseName(job?.databaseId || "")} ativado`
    )
  }

  const handleRunNow = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId)
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Executando backup de ${getDatabaseName(job?.databaseId || "")}...`,
        success: "Backup iniciado com sucesso!",
        error: "Falha ao iniciar backup",
      }
    )
  }

  const activeJobs = jobs.filter((j) => j.isActive).length
  const totalJobs = jobs.length

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Jobs de Backup"
        description="Configure agendamentos automáticos"
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Agendamentos
            </h2>
            <p className="text-muted-foreground">
              {activeJobs} de {totalJobs} jobs ativos
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Novo Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalJobs}</p>
                <p className="text-xs text-muted-foreground">Total de Jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Play className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeJobs}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <RefreshCw className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {jobs.filter((j) => j.frequency === "hourly").length}
                </p>
                <p className="text-xs text-muted-foreground">Por Hora</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {jobs.filter((j) => j.frequency === "daily").length}
                </p>
                <p className="text-xs text-muted-foreground">Diários</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Lista de Jobs</CardTitle>
            <CardDescription>
              Gerencie todos os agendamentos de backup configurados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Banco de Dados</TableHead>
                    <TableHead className="text-muted-foreground">Frequência</TableHead>
                    <TableHead className="text-muted-foreground">Horário</TableHead>
                    <TableHead className="text-muted-foreground">Retenção</TableHead>
                    <TableHead className="text-muted-foreground">Próxima Execução</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} className="border-border">
                      <TableCell className="font-medium text-foreground">
                        {getDatabaseName(job.databaseId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={frequencyColors[job.frequency]}>
                          {frequencyLabels[job.frequency]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">{job.time}</TableCell>
                      <TableCell className="text-foreground">{job.retentionDays} dias</TableCell>
                      <TableCell className="text-muted-foreground">
                        {job.nextRun && job.isActive
                          ? formatDistanceToNow(job.nextRun, {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={job.isActive}
                          onCheckedChange={() => handleToggleJob(job.id)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRunNow(job.id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Executar agora
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {job.isActive ? (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pausar
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              Configurar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Next Scheduled */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Próximas Execuções</CardTitle>
            <CardDescription>
              Backups agendados para as próximas horas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobs
                .filter((j) => j.isActive && j.nextRun)
                .sort((a, b) => (a.nextRun?.getTime() || 0) - (b.nextRun?.getTime() || 0))
                .slice(0, 5)
                .map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {getDatabaseName(job.databaseId)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {job.nextRun && format(job.nextRun, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={frequencyColors[job.frequency]}>
                        {frequencyLabels[job.frequency]}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunNow(job.id)}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Executar
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
