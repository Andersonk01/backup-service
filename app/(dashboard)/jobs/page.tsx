"use client"

import { useState, useEffect, useCallback } from "react"
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
  Loader2,
  HardDrive,
  Cloud,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { jobsApi, runsApi, databasesApi } from "@/lib/api"
import type { BackupJob, Database } from "@/lib/types"

const frequencyLabels: Record<string, string> = {
  hourly: "A cada hora",
  daily: "Diário",
  weekly: "Semanal",
}

const frequencyColors: Record<string, string> = {
  hourly: "bg-info/10 text-info border-info/20",
  daily: "bg-primary/10 text-primary border-primary/20",
  weekly: "bg-warning/10 text-warning border-warning/20",
}

const destinationLabels: Record<string, string> = {
  local: "Local",
  remote: "Remoto",
  both: "Local + Remoto",
}

const destinationIcons: Record<string, React.ReactNode> = {
  local: <HardDrive className="h-3 w-3 mr-1" />,
  remote: <Cloud className="h-3 w-3 mr-1" />,
  both: <><HardDrive className="h-3 w-3 mr-0.5" /><Cloud className="h-3 w-3" /></>,
}

const destinationColors: Record<string, string> = {
  local: "bg-secondary/50 text-foreground border-border",
  remote: "bg-info/10 text-info border-info/20",
  both: "bg-primary/10 text-primary border-primary/20",
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<BackupJob[]>([])
  const [databases, setDatabases] = useState<Database[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [createData, setCreateData] = useState({
    databaseId: "",
    frequency: "daily",
    time: "02:00",
    retentionDays: 7,
    destination: "remote",
  })

  const fetchData = useCallback(async () => {
    try {
      const [jobsData, dbsData] = await Promise.all([
        jobsApi.getAll(),
        databasesApi.getAll(),
      ])
      setJobs(jobsData)
      setDatabases(dbsData)
    } catch {
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getDatabaseName = (databaseId: string) => {
    return databases.find((db) => db.id === databaseId)?.name || "Desconhecido"
  }

  const handleToggleJob = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return

    try {
      const updated = await jobsApi.toggle(jobId, !job.isActive)
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, isActive: updated.isActive } : j)))
      toast.success(updated.isActive ? "Job ativado" : "Job desativado")
    } catch {
      toast.error("Erro ao alterar job")
    }
  }

  const handleRunNow = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return

    try {
      await runsApi.create(job.databaseId)
      toast.success("Backup iniciado com sucesso!")
    } catch {
      toast.error("Erro ao iniciar backup")
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      await jobsApi.delete(jobId)
      setJobs((prev) => prev.filter((j) => j.id !== jobId))
      toast.success("Job excluído")
    } catch {
      toast.error("Erro ao excluir job")
    }
  }

  const handleCreateJob = async () => {
    if (!createData.databaseId) {
      toast.error("Selecione um banco de dados")
      return
    }

    try {
      await jobsApi.create({
        databaseId: createData.databaseId,
        frequency: createData.frequency,
        time: createData.time,
        retentionDays: createData.retentionDays,
        destination: createData.destination,
      })
      toast.success("Job criado com sucesso!")
      setCreateOpen(false)
      setCreateData({ databaseId: "", frequency: "daily", time: "02:00", retentionDays: 7, destination: "remote" })
      fetchData()
    } catch {
      toast.error("Erro ao criar job")
    }
  }

  const activeJobs = jobs.filter((j) => j.isActive).length
  const totalJobs = jobs.length

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Jobs de Backup" description="Configure agendamentos automáticos" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

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
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Novo Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Job de Backup</DialogTitle>
                <DialogDescription>
                  Configure um novo backup agendado
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Banco de Dados</Label>
                  <Select
                    value={createData.databaseId}
                    onValueChange={(v) => setCreateData({ ...createData, databaseId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {databases.map((db) => (
                        <SelectItem key={db.id} value={db.id}>
                          {db.name} ({db.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select
                    value={createData.frequency}
                    onValueChange={(v) => setCreateData({ ...createData, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">A cada hora</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={createData.time}
                    onChange={(e) => setCreateData({ ...createData, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dias de Retenção</Label>
                  <Input
                    type="number"
                    min={1}
                    value={createData.retentionDays}
                    onChange={(e) => setCreateData({ ...createData, retentionDays: parseInt(e.target.value) || 7 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destino do Backup</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["local", "remote", "both"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCreateData({ ...createData, destination: opt })}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors ${
                          createData.destination === opt
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                        }`}
                      >
                        <span className="flex items-center gap-1 text-sm">
                          {destinationIcons[opt]}
                        </span>
                        <span>{destinationLabels[opt]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateJob}>Criar Job</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Calendar className="h-12 w-12 text-muted-foreground/30" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Nenhum job configurado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Crie um job para agendar backups automáticos
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Banco de Dados</TableHead>
                      <TableHead className="text-muted-foreground">Frequência</TableHead>
                      <TableHead className="text-muted-foreground">Horário</TableHead>
                      <TableHead className="text-muted-foreground">Destino</TableHead>
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
                            {frequencyLabels[job.frequency] || job.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">{job.time}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={destinationColors[job.destination] || destinationColors.remote}>
                            <span className="flex items-center">
                              {destinationIcons[job.destination] || destinationIcons.remote}
                              {destinationLabels[job.destination] || "Remoto"}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">{job.retentionDays} dias</TableCell>
                        <TableCell className="text-muted-foreground">
                          {job.nextRun && job.isActive
                            ? formatDistanceToNow(new Date(job.nextRun), {
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteJob(job.id)}
                              >
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
            )}
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
            {jobs.filter((j) => j.isActive && j.nextRun).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum backup agendado
              </p>
            ) : (
              <div className="space-y-3">
                {jobs
                  .filter((j) => j.isActive && j.nextRun)
                  .sort((a, b) => (new Date(a.nextRun!).getTime()) - (new Date(b.nextRun!).getTime()))
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
                            {job.nextRun && format(new Date(job.nextRun), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={frequencyColors[job.frequency]}>
                          {frequencyLabels[job.frequency] || job.frequency}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
