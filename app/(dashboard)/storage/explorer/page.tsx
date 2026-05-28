"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Folder,
  File,
  FileText,
  Image,
  Archive,
  ChevronRight,
  ChevronLeft,
  Upload,
  Plus,
  Download,
  Trash2,
  Edit3,
  Loader2,
  MoreVertical,
  Home,
  Cloud,
  HardDrive,
} from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { fileApi, storageApi } from "@/lib/api"
import type { FileEntry, RemoteInfo } from "@/lib/api"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "—"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function FileIcon({ entry }: { entry: FileEntry }) {
  if (entry.isDir) return <Folder className="h-4 w-4 text-primary shrink-0" />
  const ext = entry.name.split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return <Image className="h-4 w-4 text-info shrink-0" />
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext || "")) return <Archive className="h-4 w-4 text-warning shrink-0" />
  if (["pdf", "doc", "docx", "txt", "csv", "json", "xml"].includes(ext || "")) return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
  return <File className="h-4 w-4 text-muted-foreground shrink-0" />
}

function ExplorerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const remoteName = searchParams.get("remote") || ""
  const initialPath = searchParams.get("path") || ""

  const [currentPath, setCurrentPath] = useState(initialPath)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [renameTarget, setRenameTarget] = useState<FileEntry | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const [remotes, setRemotes] = useState<RemoteInfo[]>([])
  const [loadingRemotes, setLoadingRemotes] = useState(false)

  const fetchFiles = useCallback(async () => {
    if (!remoteName) return
    setLoading(true)
    try {
      const data = await fileApi.list(remoteName, currentPath)
      setFiles(data.files)
    } catch {
      toast.error("Erro ao carregar arquivos")
    } finally {
      setLoading(false)
    }
  }, [remoteName, currentPath])

  useEffect(() => {
    if (remoteName) {
      fetchFiles()
    }
  }, [fetchFiles, remoteName])

  useEffect(() => {
    if (!remoteName) {
      setLoadingRemotes(true)
      storageApi.getRemotes()
        .then((data) => setRemotes(data.remotes))
        .catch(() => {})
        .finally(() => setLoadingRemotes(false))
    }
  }, [remoteName])

  if (!remoteName) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Arquivos" description="Navegue pelos arquivos nos seus remotes" />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {loadingRemotes ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : remotes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <Folder className="h-16 w-16 text-muted-foreground/30" />
              <p className="text-lg text-foreground font-medium">Nenhum remote configurado</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Adicione um remote na página de Armazenamento para começar a explorar arquivos.
              </p>
              <Button onClick={() => router.push("/storage")}>
                Ir para Armazenamento
              </Button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Selecione um remote</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha qual remote deseja explorar
                </p>
              </div>
              <div className="grid gap-3">
                {remotes.map((remote) => (
                  <button
                    key={remote.name}
                    onClick={() => router.push(`/storage/explorer?remote=${encodeURIComponent(remote.name)}`)}
                    className="flex items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-secondary/50 hover:border-primary/50"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      {remote.type === "drive" ? (
                        <Cloud className="h-6 w-6 text-primary" />
                      ) : (
                        <HardDrive className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{remote.name}</p>
                      <p className="text-sm text-muted-foreground">{remote.type}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  function navigateTo(path: string) {
    setCurrentPath(path)
  }

  function goUp() {
    const parts = currentPath.split("/").filter(Boolean)
    parts.pop()
    setCurrentPath(parts.length > 0 ? "/" + parts.join("/") : "")
  }

  const pathParts = currentPath.split("/").filter(Boolean)

  async function handleDelete(entry: FileEntry) {
    if (!confirm(`Deletar "${entry.name}"?`)) return
    try {
      await fileApi._delete(remoteName, entry.path, entry.isDir)
      toast.success(`"${entry.name}" deletado`)
      fetchFiles()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar")
    }
  }

  async function handleRename() {
    if (!renameTarget || !renameValue.trim()) return
    const parts = renameTarget.path.split("/")
    parts[parts.length - 1] = renameValue.trim()
    const newPath = parts.join("/")
    try {
      await fileApi.rename(remoteName, renameTarget.path, newPath)
      toast.success("Renomeado com sucesso")
      setRenameTarget(null)
      fetchFiles()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao renomear")
    }
  }

  async function handleNewFolder() {
    if (!newFolderName.trim()) return
    const newPath = currentPath ? `${currentPath}/${newFolderName.trim()}` : newFolderName.trim()
    try {
      await fileApi.mkdir(remoteName, newPath)
      toast.success("Pasta criada")
      setNewFolderOpen(false)
      setNewFolderName("")
      fetchFiles()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar pasta")
    }
  }

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      await fileApi.upload(remoteName, file, currentPath)
      toast.success(`"${file.name}" enviado`)
      fetchFiles()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload")
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(entry: FileEntry) {
    try {
      const blob = await fileApi.download(remoteName, entry.path)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = entry.name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Erro no download")
    }
  }

  if (!remoteName) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Explorador" description="Navegue pelos arquivos" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Selecione um remote para explorar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title={remoteName}
        description="Gerenciar arquivos e pastas"
      />

      <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/storage")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground">{remoteName}:</span>
            <button onClick={() => navigateTo("")} className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </button>
            {pathParts.map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <button
                  onClick={() => navigateTo("/" + pathParts.slice(0, i + 1).join("/"))}
                  className="hover:text-foreground transition-colors"
                >
                  {part}
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                e.target.value = ""
              }}
            />
            <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Pasta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Pasta</DialogTitle>
                  <DialogDescription>Crie uma nova pasta no diretório atual</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label>Nome da pasta</Label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Ex: Backups-Julho"
                    onKeyDown={(e) => { if (e.key === "Enter") handleNewFolder() }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancelar</Button>
                  <Button onClick={handleNewFolder}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {currentPath && (
              <Button variant="ghost" size="sm" onClick={goUp}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>
        </div>

        {/* File list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Folder className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Pasta vazia</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-[50%]">Nome</TableHead>
                  <TableHead className="text-muted-foreground w-[20%]">Tamanho</TableHead>
                  <TableHead className="text-muted-foreground w-[25%]">Modificado</TableHead>
                  <TableHead className="text-muted-foreground w-[5%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((entry) => (
                  <TableRow
                    key={entry.path}
                    className="border-border cursor-pointer hover:bg-secondary/30"
                    onClick={() => entry.isDir ? navigateTo(entry.path) : undefined}
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <FileIcon entry={entry} />
                        <span className="truncate">{entry.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {entry.isDir ? "—" : formatBytes(entry.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(entry.modTime)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!entry.isDir && (
                            <DropdownMenuItem onClick={() => handleDownload(entry)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => { setRenameTarget(entry); setRenameValue(entry.name) }}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Renomear
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(entry)}>
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
      </div>

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => { if (!o) setRenameTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear</DialogTitle>
            <DialogDescription>Digite o novo nome</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Novo nome</Label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename() }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancelar</Button>
            <Button onClick={handleRename}>Renomear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ExplorerContent />
    </Suspense>
  )
}
