"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Cloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  FileJson,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LogIn,
  Copy,
  Key,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { oauthApi } from "@/lib/api"

interface AddRemoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type AuthMethod = "device-flow" | "service-account" | "paste-token"
type Step = "provider" | "name" | "auth" | "test"

export function AddRemoteDialog({ open, onOpenChange, onSuccess }: AddRemoteDialogProps) {
  const [step, setStep] = useState<Step>("provider")
  const [remoteName, setRemoteName] = useState("")
  const [authMethod, setAuthMethod] = useState<AuthMethod>("device-flow")
  const [serviceAccountJson, setServiceAccountJson] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [scope, setScope] = useState("drive")
  const [rootFolderId, setRootFolderId] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [isPolling, setIsPolling] = useState(false)
  const [authSuccess, setAuthSuccess] = useState(false)
  const [tokenJson, setTokenJson] = useState<string | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const pollingRef = useRef(false)
  const [oauthState, setOauthState] = useState<string | null>(null)
  const popupRef = useRef<Window | null>(null)

  const [pastedToken, setPastedToken] = useState("")
  const [checkingNow, setCheckingNow] = useState(false)

  function resetForm() {
    setStep("provider")
    setRemoteName("")
    setAuthMethod("device-flow")
    setServiceAccountJson("")
    setShowAdvanced(false)
    setScope("drive")
    setRootFolderId("")
    setTesting(false)
    setTestResult(null)
    setIsPolling(false)
    setAuthSuccess(false)
    setTokenJson(null)
    setOauthError(null)
    pollingRef.current = false
    setOauthState(null)
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    popupRef.current = null
    setPastedToken("")
    setCheckingNow(false)
  }

  function handleClose() {
    resetForm()
    onOpenChange(false)
  }

  function handleNext() {
    if (step === "provider") setStep("name")
    else if (step === "name") setStep("auth")
    else if (step === "auth") setStep("test")
  }

  function handleBack() {
    if (step === "name") setStep("provider")
    else if (step === "auth") setStep("name")
    else if (step === "test") setStep("auth")
  }

  const startDeviceFlow = useCallback(async () => {
    setIsPolling(true)
    setOauthError(null)
    pollingRef.current = true

    try {
      const result = await oauthApi.start()
      setOauthState(result.state)

      const w = window.open(
        result.auth_url,
        "google-oauth",
        "width=600,height=700,left=200,top=100"
      )
      popupRef.current = w
    } catch (error) {
      setOauthError(error instanceof Error ? error.message : "Falha ao iniciar autenticação")
      setIsPolling(false)
      pollingRef.current = false
    }
  }, [])

  const checkNow = useCallback(async () => {
    if (!oauthState) return
    setCheckingNow(true)
    try {
      const result = await oauthApi.checkStatus(oauthState)
      if (result.status === "success" && result.token) {
        setAuthSuccess(true)
        setIsPolling(false)
        pollingRef.current = false
        setTokenJson(result.token)
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close()
        }
        return
      }
      if (result.status === "error") {
        setOauthError(result.error || "Erro na autenticação")
        setIsPolling(false)
        pollingRef.current = false
        return
      }
      if (result.status === "expired") {
        setOauthError(result.error || "Tempo excedido. Tente novamente.")
        setIsPolling(false)
        pollingRef.current = false
        return
      }
      toast.info("Ainda aguardando autorização do Google...")
    } catch {
      toast.error("Erro ao verificar status")
    } finally {
      setCheckingNow(false)
    }
  }, [oauthState])

  useEffect(() => {
    if (!oauthState || !isPolling || authSuccess) return

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      if (!pollingRef.current || cancelled || !oauthState) return

      try {
        const result = await oauthApi.checkStatus(oauthState)

        if (cancelled) return

        if (result.status === "success" && result.token) {
          setAuthSuccess(true)
          setIsPolling(false)
          pollingRef.current = false
          setTokenJson(result.token)
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close()
          }
          return
        }

        if (result.status === "error") {
          setOauthError(result.error || "Erro na autenticação")
          setIsPolling(false)
          pollingRef.current = false
          return
        }

        if (result.status === "expired") {
          setOauthError(result.error || "Tempo excedido. Tente novamente.")
          setIsPolling(false)
          pollingRef.current = false
          return
        }

        timeoutId = setTimeout(poll, 1500)
      } catch {
        if (!cancelled) {
          timeoutId = setTimeout(poll, 3000)
        }
      }
    }

    poll()
    return () => { cancelled = true; clearTimeout(timeoutId) }
  }, [isPolling, authSuccess, oauthState])

  function buildConfig(): Record<string, string> {
    const config: Record<string, string> = { scope }

    if (authMethod === "service-account" && serviceAccountJson) {
      config.service_account_credentials = serviceAccountJson
    } else if (authMethod === "device-flow" && tokenJson) {
      config.token = tokenJson
    } else if (authMethod === "paste-token" && pastedToken) {
      config.token = pastedToken
    }

    if (rootFolderId) config.root_folder_id = rootFolderId
    return config
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)

    try {
      const config = buildConfig()

      const createRes = await fetch("/api/storage/remotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: remoteName, type: "drive", config }),
      })

      if (!createRes.ok) {
        const err = await createRes.json()
        throw new Error(err.error || "Falha ao criar remote")
      }

      const testRes = await fetch(`/api/storage/remotes/${encodeURIComponent(remoteName)}/test`, {
        method: "POST",
      })

      const result = await testRes.json()
      setTestResult(result)

      if (!result.success) {
        await fetch(`/api/storage/remotes/${encodeURIComponent(remoteName)}`, {
          method: "DELETE",
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Teste falhou",
      })
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    if (!testResult?.success) return
    toast.success(`Remote "${remoteName}" configurado com sucesso!`)
    onSuccess?.()
    handleClose()
  }

  const canProceed = {
    provider: true,
    name: remoteName.trim().length > 0,
    auth:
      authMethod === "service-account" ? serviceAccountJson.trim().length > 0
      : authMethod === "paste-token" ? pastedToken.trim().length > 0
      : tokenJson !== null,
    test: testResult?.success === true,
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Adicionar Remote
          </DialogTitle>
          <DialogDescription>
            Configure o armazenamento em nuvem via Google Drive
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          {(["provider", "name", "auth", "test"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : (["provider", "name", "auth", "test"] as const).indexOf(step) > i
                    ? "bg-success/20 text-success"
                    : "bg-secondary text-muted-foreground"
              }`}>
                {(["provider", "name", "auth", "test"] as const).indexOf(step) > i
                  ? <CheckCircle2 className="h-3.5 w-3.5" />
                  : i + 1
                }
              </div>
              <span className={step === s ? "text-foreground font-medium" : ""}>
                {s === "provider" ? "Provedor" : s === "name" ? "Nome" : s === "auth" ? "Autenticação" : "Teste"}
              </span>
              {i < 3 && <ChevronRight className="h-3 w-3" />}
            </div>
          ))}
        </div>

        <Separator />

        {step === "provider" && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Selecione o provedor de armazenamento</p>
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-lg border-2 border-primary bg-primary/5 p-4 transition-colors hover:bg-primary/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Cloud className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Google Drive</p>
                <p className="text-sm text-muted-foreground">Armazenamento na nuvem do Google</p>
              </div>
            </button>
          </div>
        )}

        {step === "name" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="remote-name">Nome do Remote</Label>
              <Input
                id="remote-name"
                placeholder="Ex: meu-google-drive"
                value={remoteName}
                onChange={(e) => setRemoteName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              />
              <p className="text-xs text-muted-foreground">Apenas letras minúsculas, números e hífens</p>
            </div>
          </div>
        )}

        {step === "auth" && (
          <div className="space-y-4 py-2 max-h-[400px] overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              Escolha como autenticar no Google Drive
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setAuthMethod("device-flow"); setOauthError(null) }}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-colors ${
                  authMethod === "device-flow" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <LogIn className={`h-6 w-6 ${authMethod === "device-flow" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-medium">Conectar com Google</span>
                <span className="text-[10px] text-muted-foreground">Usa sua conta pessoal</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod("service-account")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-colors ${
                  authMethod === "service-account" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <FileJson className={`h-6 w-6 ${authMethod === "service-account" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-medium">Conta de Serviço</span>
                <span className="text-[10px] text-muted-foreground">Chave JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod("paste-token")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-colors ${
                  authMethod === "paste-token" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Key className={`h-6 w-6 ${authMethod === "paste-token" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-medium">Colar Token</span>
                <span className="text-[10px] text-muted-foreground">De outro rclone</span>
              </button>
            </div>

            {/* Device Flow */}
            {authMethod === "device-flow" && !isPolling && !oauthError && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Cloud className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-sm text-center text-muted-foreground">
                  Autentique com sua conta Google para acessar o Drive
                </p>
                <Button onClick={startDeviceFlow} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Conectar com Google
                </Button>
              </div>
            )}

            {authMethod === "device-flow" && isPolling && !authSuccess && (
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  {popupRef.current && !popupRef.current.closed ? (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        Faça login no Google na janela aberta
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Autorize o acesso ao Google Drive para continuar
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          if (popupRef.current && !popupRef.current.closed) {
                            popupRef.current.focus()
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Focar na janela
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        Aguardando autorização...
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Se você já autorizou, clique em "Verificar"
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => checkNow()}
                        disabled={checkingNow}
                      >
                        {checkingNow ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando...</>
                        ) : (
                          <><RefreshCw className="h-4 w-4 mr-2" /> Já autorizou? Verificar</>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {authMethod === "device-flow" && authSuccess && (
              <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-4">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <div>
                  <p className="text-sm font-medium text-success">Autenticado com sucesso!</p>
                  <p className="text-xs text-muted-foreground">Continue para testar a conexão.</p>
                </div>
              </div>
            )}

            {/* Error message */}
            {oauthError && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">Erro na autenticação</p>
                  <p className="text-xs text-muted-foreground mt-1">{oauthError}</p>
                  {authMethod === "device-flow" && !isPolling && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={startDeviceFlow}>
                      Tentar novamente
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Service Account */}
            {authMethod === "service-account" && (
              <div className="space-y-2">
                <Label htmlFor="sa-json">Credenciais da Conta de Serviço (JSON)</Label>
                <Textarea
                  id="sa-json"
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  className="min-h-[120px] font-mono text-xs"
                  value={serviceAccountJson}
                  onChange={(e) => setServiceAccountJson(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cole o conteúdo do arquivo JSON da conta de serviço
                </p>
              </div>
            )}

            {/* Paste Token */}
            {authMethod === "paste-token" && (
              <div className="space-y-2">
                <Label htmlFor="pasted-token">Token de Acesso (JSON)</Label>
                <Textarea
                  id="pasted-token"
                  placeholder='{"access_token": "...", "token_type": "Bearer", "refresh_token": "...", "expiry": "..."}'
                  className="min-h-[120px] font-mono text-xs"
                  value={pastedToken}
                  onChange={(e) => setPastedToken(e.target.value)}
                />
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Se você tem acesso ao rclone em outra máquina, execute:
                  </p>
                  <code className="mt-1 block rounded bg-background p-2 text-xs">
                    rclone authorize &quot;drive&quot;
                  </code>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Copie o JSON gerado e cole aqui.
                  </p>
                </div>
              </div>
            )}

            {/* Advanced options */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Opções avançadas
            </button>

            {showAdvanced && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Root Folder ID</Label>
                  <Input placeholder="Opcional" className="h-8 text-xs" value={rootFolderId} onChange={(e) => setRootFolderId(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Scope</Label>
                  <Input placeholder="drive" className="h-8 text-xs" value={scope} onChange={(e) => setScope(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {step === "test" && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Teste a conexão antes de finalizar</p>

            {!testResult && !testing && (
              <div className="flex flex-col items-center gap-4 py-6">
                <Cloud className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground text-center">
                  Clique em "Testar Conexão" para verificar as credenciais
                </p>
                <Button onClick={handleTest}>Testar Conexão</Button>
              </div>
            )}

            {testing && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Testando conexão...</p>
              </div>
            )}

            {testResult && !testing && (
              <div className={`flex items-start gap-3 rounded-lg border p-4 ${
                testResult.success ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
              }`}>
                {testResult.success
                  ? <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  : <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                }
                <div>
                  <p className={`text-sm font-medium ${testResult.success ? "text-success" : "text-destructive"}`}>
                    {testResult.success ? "Conexão estabelecida!" : "Falha na conexão"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div>
            {step !== "provider" && (
              <Button variant="ghost" onClick={handleBack} disabled={testing || isPolling}>Voltar</Button>
            )}
          </div>
          <div className="flex gap-2">
            {step !== "test" && (
              <Button onClick={handleNext} disabled={!canProceed[step]}>Próximo</Button>
            )}
            {step === "test" && testResult?.success && (
              <Button onClick={handleSave}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Salvar Remote
              </Button>
            )}
            {step === "test" && testResult && !testResult.success && (
              <Button variant="outline" onClick={handleBack}>Corrigir Configuração</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
