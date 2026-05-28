"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Settings,
  Bell,
  Shield,
  Cloud,
  Key,
  Mail,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { storageApi, settingsApi } from "@/lib/api"
import type { RemoteInfo, AppSettings } from "@/lib/api"
import { AddRemoteDialog } from "@/components/dialogs/add-remote-dialog"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    emailOnSuccess: false,
    emailOnFailure: true,
    emailOnWarning: true,
    slackIntegration: false,
  })

  const [security, setSecurity] = useState({
    encryptBackups: true,
    twoFactor: false,
    apiKeyRotation: "30",
  })

  const [remotes, setRemotes] = useState<RemoteInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [testingRemote, setTestingRemote] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [defaultRemote, setDefaultRemote] = useState("")
  const [backupPath, setBackupPath] = useState("/backups")

  const fetchAll = useCallback(async () => {
    try {
      const [remoteData, settingsData] = await Promise.all([
        storageApi.getRemotes(),
        settingsApi.get(),
      ])
      setRemotes(remoteData.remotes)
      setDefaultRemote(settingsData.defaultRemote || "")
      setBackupPath(settingsData.storageBackupPath || "/backups")
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleSave = async () => {
    try {
      await settingsApi.save({
        defaultRemote,
        storageBackupPath: backupPath,
      })
      toast.success("Configurações salvas com sucesso!")
    } catch {
      toast.error("Falha ao salvar configurações")
    }
  }

  const handleTestConnection = async (name: string) => {
    setTestingRemote(name)
    try {
      const result = await storageApi.testRemote(name)
      if (result.success) {
        toast.success(`Conexão com "${name}" estabelecida!`)
      } else {
        toast.error(`Falha na conexão: ${result.message}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha na conexão")
    } finally {
      setTestingRemote(null)
    }
  }

  const handleDeleteRemote = async (name: string) => {
    setDeleting(name)
    try {
      await storageApi.deleteRemote(name)
      toast.success(`Remote "${name}" removido`)
      fetchAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Configurações"
        description="Gerencie as configurações do sistema"
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="storage">Armazenamento</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Configurações Gerais
                </CardTitle>
                <CardDescription>
                  Configurações básicas do sistema de backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select defaultValue="america-sao-paulo">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fuso horário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="america-sao-paulo">América/São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="america-new-york">América/New York (GMT-5)</SelectItem>
                        <SelectItem value="europe-london">Europa/Londres (GMT+0)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select defaultValue="pt-br">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                        <SelectItem value="en-us">English (US)</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Worker de Backup</h4>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Worker Ativo</p>
                        <p className="text-sm text-muted-foreground">
                          Última verificação: há 2 minutos
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Online
                    </Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="workerInterval">Intervalo de Verificação</Label>
                      <Select defaultValue="60">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o intervalo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 segundos</SelectItem>
                          <SelectItem value="60">1 minuto</SelectItem>
                          <SelectItem value="300">5 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="concurrency">Concorrência Máxima</Label>
                      <Select defaultValue="2">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 backup por vez</SelectItem>
                          <SelectItem value="2">2 backups simultâneos</SelectItem>
                          <SelectItem value="3">3 backups simultâneos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notificações por Email
                </CardTitle>
                <CardDescription>
                  Configure quando receber notificações por email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email para Notificações</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@exemplo.com"
                    defaultValue="admin@exemplo.com"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground">Backup com Sucesso</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber email quando um backup for concluído
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailOnSuccess}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailOnSuccess: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground">Backup com Falha</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber email quando um backup falhar
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailOnFailure}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailOnFailure: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground">Avisos do Sistema</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber avisos sobre espaço, conexões, etc.
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailOnWarning}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailOnWarning: checked })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Integrações</h4>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Slack</p>
                        <p className="text-sm text-muted-foreground">
                          Enviar notificações para um canal do Slack
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.slackIntegration}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, slackIntegration: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Segurança
                </CardTitle>
                <CardDescription>
                  Configurações de segurança e criptografia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Criptografia de Backups</p>
                      <p className="text-sm text-muted-foreground">
                        Criptografar arquivos antes do upload (AES-256)
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={security.encryptBackups}
                    onCheckedChange={(checked) =>
                      setSecurity({ ...security, encryptBackups: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Autenticação de Dois Fatores</p>
                      <p className="text-sm text-muted-foreground">
                        Exigir 2FA para acessar o painel
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={security.twoFactor}
                    onCheckedChange={(checked) =>
                      setSecurity({ ...security, twoFactor: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Rotação de Chaves</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Rotação Automática de API Key</Label>
                      <Select
                        value={security.apiKeyRotation}
                        onValueChange={(value) =>
                          setSecurity({ ...security, apiKeyRotation: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Desabilitado</SelectItem>
                          <SelectItem value="7">A cada 7 dias</SelectItem>
                          <SelectItem value="30">A cada 30 dias</SelectItem>
                          <SelectItem value="90">A cada 90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Credenciais de Banco</h4>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Todas as credenciais estão criptografadas com AES-256</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Storage */}
          <TabsContent value="storage" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  Remotes rclone
                </CardTitle>
                <CardDescription>
                  Gerencie os remotes de armazenamento configurados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : remotes.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Cloud className="h-12 w-12 text-muted-foreground/30" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Nenhum remote configurado</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Adicione um remote para armazenar backups na nuvem
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Remote
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {remotes.map((remote) => (
                      <div
                        key={remote.name}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                            <Cloud className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{remote.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {remote.type === "drive" ? "Google Drive" : remote.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestConnection(remote.name)}
                            disabled={testingRemote === remote.name}
                          >
                            {testingRemote === remote.name ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
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

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Configurações Gerais</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="default-remote">Remote Padrão</Label>
                      <Select
                        value={defaultRemote}
                        onValueChange={setDefaultRemote}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um remote" />
                        </SelectTrigger>
                        <SelectContent>
                          {remotes.map((r) => (
                            <SelectItem key={r.name} value={r.name}>
                              {r.name} ({r.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backup-path">Caminho Remoto para Backups</Label>
                      <Input
                        id="backup-path"
                        value={backupPath}
                        onChange={(e) => setBackupPath(e.target.value)}
                        placeholder="/backups"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Remote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <AddRemoteDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchAll}
      />
    </div>
  )
}
