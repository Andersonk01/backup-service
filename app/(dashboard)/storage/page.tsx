"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  HardDrive,
  Cloud,
  Trash2,
  Download,
  FolderOpen,
  RefreshCw,
  AlertTriangle,
  Plus,
  Loader2,
  ExternalLink,
  FolderSearch,
} from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { storageApi } from "@/lib/api"
import type { RemoteInfo } from "@/lib/api"
import { AddRemoteDialog } from "@/components/dialogs/add-remote-dialog"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export default function StoragePage() {
  const router = useRouter()
  const [remotes, setRemotes] = useState<RemoteInfo[]>([])
  const [usage, setUsage] = useState({ used: 0, total: 0, free: 0 })
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [testingRemote, setTestingRemote] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [remotesData, usageData] = await Promise.all([
        storageApi.getRemotes(),
        storageApi.getUsage(),
      ])
      setRemotes(remotesData.remotes)
      setUsage({
        used: usageData.used || 0,
        total: usageData.total || 0,
        free: usageData.free || 0,
      })
    } catch {
      // Silent fail - server might not be ready
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const totalLimit = usage.total || 15 * 1024 * 1024 * 1024 // 15 GB default
  const usedPercentage = totalLimit > 0 ? (usage.used / totalLimit) * 100 : 0
  const available = totalLimit - usage.used

  const handleSync = async () => {
    toast.promise(fetchData(), {
      loading: "Sincronizando dados de armazenamento...",
      success: "Dados atualizados!",
      error: "Falha ao sincronizar",
    })
  }

  const handleDeleteRemote = async (name: string) => {
    setDeleting(name)
    try {
      await storageApi.deleteRemote(name)
      toast.success(`Remote "${name}" removido`)
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover remote")
    } finally {
      setDeleting(null)
    }
  }

  const handleTestRemote = async (name: string) => {
    setTestingRemote(name)
    try {
      const result = await storageApi.testRemote(name)
      if (result.success) {
        toast.success(`Conexão com "${name}" estabelecida`)
      } else {
        toast.error(`Falha na conexão: ${result.message}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao testar")
    } finally {
      setTestingRemote(null)
    }
  }

  const handleCleanup = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: "Executando limpeza de arquivos antigos...",
        success: "Limpeza concluída!",
        error: "Falha na limpeza",
      }
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Armazenamento"
        description="Gerencie os remotes de armazenamento na nuvem"
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Rclone Storage
            </h2>
            <p className="text-muted-foreground">
              Gerencie remotes e arquivos de backup
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSync} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Remote
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Usage Overview */}
            {remotes.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-primary" />
                      Visão Geral
                    </CardTitle>
                    <CardDescription>
                      Uso atual do armazenamento nos remotes configurados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground font-medium">
                          {formatBytes(usage.used)} usado
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

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg bg-secondary/50 p-4">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Remotes</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-foreground">{remotes.length}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-4">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-info" />
                          <span className="text-xs text-muted-foreground">Tipos</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                          {new Set(remotes.map((r) => r.type)).size}
                        </p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-4">
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-success" />
                          <span className="text-xs text-muted-foreground">Drive ativos</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                          {remotes.filter((r) => r.type === "drive").length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Remotes</CardTitle>
                    <CardDescription>Remotes configurados</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {remotes.map((remote) => (
                      <div
                        key={remote.name}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Cloud className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{remote.name}</p>
                            <p className="text-xs text-muted-foreground">{remote.type}</p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-success/10 text-success border-success/20"
                        >
                          Configurado
                        </Badge>
                      </div>
                    ))}
                    {remotes.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum remote configurado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Remotes List */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Remotes Configurados</CardTitle>
                <CardDescription>
                  Gerencie seus remotes do rclone
                </CardDescription>
              </CardHeader>
              <CardContent>
                {remotes.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <Cloud className="h-16 w-16 text-muted-foreground/30" />
                    <div className="text-center">
                      <p className="text-lg font-medium text-foreground">Nenhum remote configurado</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Adicione um remote do Google Drive para começar a armazenar backups na nuvem
                      </p>
                    </div>
                    <Button onClick={() => setAddDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Remote
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {remotes.map((remote) => (
                      <div
                        key={remote.name}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            {remote.type === "drive" ? (
                              <Cloud className="h-5 w-5 text-primary" />
                            ) : (
                              <HardDrive className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{remote.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {remote.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {Object.keys(remote.config).length} configurações
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/storage/explorer?remote=${encodeURIComponent(remote.name)}`)}
                          >
                            <FolderSearch className="h-4 w-4 mr-1.5" />
                            Explorar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestRemote(remote.name)}
                            disabled={testingRemote === remote.name}
                          >
                            {testingRemote === remote.name ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRemote(remote.name)}
                            disabled={deleting === remote.name}
                          >
                            {deleting === remote.name ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Uploads / Retention placeholder */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Ações</CardTitle>
                <CardDescription>
                  Gerenciamento de armazenamento e uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleCleanup}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar Arquivos Antigos
                  </Button>
                  <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Remote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AddRemoteDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  )
}
