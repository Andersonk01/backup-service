"use client"

import { useState } from "react"
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

  const handleSave = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Salvando configurações...",
        success: "Configurações salvas com sucesso!",
        error: "Falha ao salvar configurações",
      }
    )
  }

  const handleTestConnection = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Testando conexão com Google Drive...",
        success: "Conexão estabelecida com sucesso!",
        error: "Falha na conexão",
      }
    )
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
                  Google Drive
                </CardTitle>
                <CardDescription>
                  Configurações de conexão com o Google Drive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <Cloud className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Conexão Ativa</p>
                      <p className="text-sm text-muted-foreground">
                        backup-orchestrator@projeto.iam.gserviceaccount.com
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Conectado
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Pasta Raiz</Label>
                    <Input defaultValue="/backups" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Quota Total</Label>
                    <Input defaultValue="20 GB" readOnly />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleTestConnection}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Testar Conexão
                  </Button>
                  <Button variant="outline">
                    Reconfigurar
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Configuração do rclone</h4>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <code className="text-xs text-muted-foreground">
                      rclone copy backup.dump drive:/backups/
                    </code>
                  </div>
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
    </div>
  )
}
