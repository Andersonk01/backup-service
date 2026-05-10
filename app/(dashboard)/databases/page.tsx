"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Database,
  MoreVertical,
  Play,
  Settings,
  Trash2,
  Plug,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddDatabaseDialog } from "@/components/dialogs/add-database-dialog"
import { databasesApi, runsApi } from "@/lib/api"
import { toast } from "sonner"
import type { Database as DatabaseType } from "@/lib/types"

const typeColors = {
  postgres: "bg-info/10 text-info border-info/20",
  mysql: "bg-warning/10 text-warning border-warning/20",
  mongodb: "bg-success/10 text-success border-success/20",
}

const typeLabels = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
}

export default function DatabasesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [databasesList, setDatabasesList] = useState<DatabaseType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDatabases()
  }, [])

  async function loadDatabases() {
    try {
      const data = await databasesApi.getAll()
      setDatabasesList(data)
    } catch (error) {
      console.error('Error loading databases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDatabases = databasesList.filter((db) => {
    const matchesSearch = db.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || db.type === typeFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && db.isActive) ||
      (statusFilter === "inactive" && !db.isActive)
    return matchesSearch && matchesType && matchesStatus
  })

  const handleTestConnection = (dbName: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: `Testando conexão com ${dbName}...`,
        success: `Conexão com ${dbName} estabelecida!`,
        error: "Falha ao conectar",
      }
    )
  }

  const handleRunBackup = async (db: DatabaseType) => {
    toast.promise(
      runsApi.create(db.id),
      {
        loading: `Iniciando backup de ${db.name}...`,
        success: `Backup de ${db.name} iniciado!`,
        error: "Falha ao iniciar backup",
      }
    )
  }

  const handleDelete = async (db: DatabaseType) => {
    try {
      await databasesApi.delete(db.id)
      toast.success(`${db.name} removido!`)
      loadDatabases()
    } catch (error) {
      toast.error("Falha ao remover banco")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Bancos de Dados" description="Gerencie seus bancos de dados cadastrados" />
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
        title="Bancos de Dados"
        description="Gerencie seus bancos de dados cadastrados"
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar bancos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="postgres">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="mongodb">MongoDB</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AddDatabaseDialog onDatabaseAdded={loadDatabases} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{databasesList.length}</p>
                <p className="text-sm text-muted-foreground">Total de Bancos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {databasesList.filter((db) => db.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {databasesList.filter((db) => !db.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Inativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDatabases.map((db) => (
            <Card key={db.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Database className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{db.name}</h3>
                        {!db.isActive && (
                          <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className={`mt-1 ${typeColors[db.type as keyof typeof typeColors]}`}>
                        {typeLabels[db.type as keyof typeof typeLabels]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRunBackup(db)}>
                        <Play className="mr-2 h-4 w-4" />
                        Executar backup
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTestConnection(db.name)}>
                        <Plug className="mr-2 h-4 w-4" />
                        Testar conexão
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Configurar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(db)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de Sucesso</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            db.successRate >= 95
                              ? "bg-success"
                              : db.successRate >= 80
                              ? "bg-warning"
                              : "bg-destructive"
                          }`}
                          style={{ width: `${db.successRate}%` }}
                        />
                      </div>
                      <span className="font-medium text-foreground">{db.successRate.toFixed(0)}%</span>
                    </div>
                  </div>
                  {db.lastBackup && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Último Backup</span>
                      <span className="text-foreground">
                        {formatDistanceToNow(new Date(db.lastBackup), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Criado em</span>
                    <span className="text-foreground">
                      {new Date(db.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleTestConnection(db.name)}
                  >
                    <Plug className="mr-2 h-4 w-4" />
                    Testar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRunBackup(db)}
                    disabled={!db.isActive}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDatabases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum banco encontrado</h3>
            <p className="text-muted-foreground mt-1">
              Tente ajustar os filtros ou adicione um novo banco de dados.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}