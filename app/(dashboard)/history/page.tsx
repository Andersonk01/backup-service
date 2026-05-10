"use client"

import { useState, useEffect } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Download,
  Eye,
  RefreshCw,
  Calendar,
} from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { runsApi } from "@/lib/api"
import type { BackupStatus } from "@/lib/types"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes < 60) return `${minutes}m ${secs}s`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

const statusConfig: Record<BackupStatus, { icon: typeof CheckCircle2; label: string; className: string }> = {
  success: {
    icon: CheckCircle2,
    label: "Sucesso",
    className: "bg-success/10 text-success border-success/20",
  },
  failed: {
    icon: XCircle,
    label: "Falha",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  running: {
    icon: Loader2,
    label: "Executando",
    className: "bg-info/10 text-info border-info/20",
  },
  pending: {
    icon: Clock,
    label: "Pendente",
    className: "bg-warning/10 text-warning border-warning/20",
  },
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [runsList, setRunsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRuns()
  }, [])

  async function loadRuns() {
    try {
      const data = await runsApi.getAll()
      setRunsList(data)
    } catch (error) {
      console.error('Error loading runs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRuns = runsList.filter((run) => {
    const matchesSearch = run.databaseName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || run.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const successCount = runsList.filter((r) => r.status === "success").length
  const failedCount = runsList.filter((r) => r.status === "failed").length
  const runningCount = runsList.filter((r) => r.status === "running").length

  const handleDownload = (run: typeof runsList[0]) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: `Preparando download de ${run.databaseName}...`,
        success: "Download iniciado!",
        error: "Falha no download",
      }
    )
  }

  const handleRetry = async (run: typeof runsList[0]) => {
    toast.promise(
      runsApi.create(run.databaseId),
      {
        loading: `Reiniciando backup de ${run.databaseName}...`,
        success: "Backup reiniciado!",
        error: "Falha ao reiniciar",
      }
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Histórico de Backups" description="Acompanhe todas as execuções de backup" />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Histórico de Backups"
        description="Acompanhe todas as execuções de backup"
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{runsList.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{successCount}</p>
                <p className="text-xs text-muted-foreground">Sucesso</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{failedCount}</p>
                <p className="text-xs text-muted-foreground">Falhas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Loader2 className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{runningCount}</p>
                <p className="text-xs text-muted-foreground">Em Execução</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por banco..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="failed">Falha</SelectItem>
              <SelectItem value="running">Em Execução</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Execuções</CardTitle>
            <CardDescription>
              Lista completa de todas as execuções de backup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Banco de Dados</TableHead>
                    <TableHead className="text-muted-foreground">Iniciado em</TableHead>
                    <TableHead className="text-muted-foreground">Duração</TableHead>
                    <TableHead className="text-muted-foreground">Tamanho</TableHead>
                    <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRuns.map((run) => {
                    const config = statusConfig[run.status as BackupStatus] || statusConfig.pending
                    const StatusIcon = config.icon

                    return (
                      <TableRow key={run.id} className="border-border">
                        <TableCell>
                          <Badge variant="outline" className={config.className}>
                            <StatusIcon
                              className={`mr-1 h-3 w-3 ${
                                run.status === "running" ? "animate-spin" : ""
                              }`}
                            />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {run.databaseName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span>{format(new Date(run.startedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                            <span className="text-xs">
                              {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {run.duration ? formatDuration(run.duration) : "-"}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {run.size ? formatBytes(run.size) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {run.status === "success" && run.filePath && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(run)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {run.status === "failed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRetry(run)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Detalhes do Backup</DialogTitle>
                                  <DialogDescription>
                                    Informações completas da execução
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Banco</p>
                                      <p className="font-medium text-foreground">{run.databaseName}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Status</p>
                                      <Badge variant="outline" className={config.className}>
                                        {config.label}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Início</p>
                                      <p className="font-medium text-foreground">
                                        {format(new Date(run.startedAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Término</p>
                                      <p className="font-medium text-foreground">
                                        {run.finishedAt
                                          ? format(new Date(run.finishedAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                                          : "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Duração</p>
                                      <p className="font-medium text-foreground">
                                        {run.duration ? formatDuration(run.duration) : "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Tamanho</p>
                                      <p className="font-medium text-foreground">
                                        {run.size ? formatBytes(run.size) : "-"}
                                      </p>
                                    </div>
                                  </div>
                                  {run.filePath && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Caminho</p>
                                      <code className="text-xs bg-muted px-2 py-1 rounded block mt-1 text-foreground">
                                        {run.filePath}
                                      </code>
                                    </div>
                                  )}
                                  {run.error && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Erro</p>
                                      <code className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded block mt-1">
                                        {run.error}
                                      </code>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {filteredRuns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhuma execução encontrada</h3>
            <p className="text-muted-foreground mt-1">
              Tente ajustar os filtros de busca.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}