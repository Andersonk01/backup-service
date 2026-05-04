"use client"

import {
  HardDrive,
  Cloud,
  Trash2,
  Download,
  FolderOpen,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { mockStorageUsage, mockDashboardStats } from "@/lib/mock-data"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const colors = [
  { bg: "bg-primary", text: "text-primary" },
  { bg: "bg-info", text: "text-info" },
  { bg: "bg-warning", text: "text-warning" },
  { bg: "bg-success", text: "text-success" },
  { bg: "bg-destructive", text: "text-destructive" },
]

export default function StoragePage() {
  const totalLimit = 21474836480 // 20 GB
  const usedPercentage = (mockDashboardStats.totalStorage / totalLimit) * 100
  const available = totalLimit - mockDashboardStats.totalStorage

  const handleCleanup = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: "Executando limpeza de arquivos antigos...",
        success: "Limpeza concluída! 2.5 GB liberados.",
        error: "Falha na limpeza",
      }
    )
  }

  const handleSync = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Sincronizando com Google Drive...",
        success: "Sincronização concluída!",
        error: "Falha na sincronização",
      }
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Armazenamento"
        description="Gerencie o espaço de backup no Google Drive"
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Google Drive Storage
            </h2>
            <p className="text-muted-foreground">
              Gerenciamento de espaço e arquivos de backup
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSync}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar
            </Button>
            <Button variant="destructive" onClick={handleCleanup}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Antigos
            </Button>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Usage Card */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                Visão Geral
              </CardTitle>
              <CardDescription>
                Uso atual do armazenamento no Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">
                    {formatBytes(mockDashboardStats.totalStorage)} usado
                  </span>
                  <span className="text-muted-foreground">
                    {formatBytes(totalLimit)} total
                  </span>
                </div>
                <Progress value={usedPercentage} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{usedPercentage.toFixed(1)}% utilizado</span>
                  <span>{formatBytes(available)} disponível</span>
                </div>
              </div>

              {/* Warning if above 80% */}
              {usedPercentage > 80 && (
                <div className="flex items-center gap-3 rounded-lg bg-warning/10 border border-warning/20 p-4">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Espaço quase esgotado
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Considere aumentar a quota ou limpar backups antigos.
                    </p>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total de Arquivos</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">156</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-info" />
                    <span className="text-xs text-muted-foreground">Pastas</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">5</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-success" />
                    <span className="text-xs text-muted-foreground">Último Upload</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-foreground">há 2h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Estatísticas</CardTitle>
              <CardDescription>Métricas de armazenamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Maior arquivo</span>
                <span className="text-sm font-medium text-foreground">2.1 GB</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Tamanho médio</span>
                <span className="text-sm font-medium text-foreground">82.5 MB</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Backups/dia</span>
                <span className="text-sm font-medium text-foreground">~14</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Crescimento/mês</span>
                <span className="text-sm font-medium text-foreground">+3.2 GB</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Dias restantes</span>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  ~45 dias
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Per-Database Usage */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Uso por Banco de Dados</CardTitle>
            <CardDescription>
              Distribuição do armazenamento entre os bancos cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockStorageUsage.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${colors[index % colors.length].bg}`}
                      />
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {item.percentage}%
                      </span>
                      <span className="text-sm font-medium text-foreground w-24 text-right">
                        {formatBytes(item.size)}
                      </span>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Retention Policies */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Políticas de Retenção</CardTitle>
            <CardDescription>
              Configurações de retenção automática por banco
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Banco de Dados
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Retenção
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Arquivos Atuais
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Próxima Limpeza
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground font-medium">Produção Principal</td>
                    <td className="py-3 px-4 text-foreground">7 dias</td>
                    <td className="py-3 px-4 text-foreground">7 arquivos</td>
                    <td className="py-3 px-4 text-muted-foreground">em 2 dias</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        Configurar
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground font-medium">API Gateway</td>
                    <td className="py-3 px-4 text-foreground">3 dias</td>
                    <td className="py-3 px-4 text-foreground">72 arquivos</td>
                    <td className="py-3 px-4 text-muted-foreground">em 1 hora</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        Configurar
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground font-medium">Analytics</td>
                    <td className="py-3 px-4 text-foreground">14 dias</td>
                    <td className="py-3 px-4 text-foreground">14 arquivos</td>
                    <td className="py-3 px-4 text-muted-foreground">em 5 dias</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        Configurar
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground font-medium">Staging</td>
                    <td className="py-3 px-4 text-foreground">5 dias</td>
                    <td className="py-3 px-4 text-foreground">5 arquivos</td>
                    <td className="py-3 px-4 text-muted-foreground">em 3 dias</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        Configurar
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
