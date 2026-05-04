"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Database as DatabaseIcon,
  MoreVertical,
  Play,
  Settings,
  Trash2,
  Plug,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Database } from "@/lib/types"

interface DatabaseListProps {
  databases: Database[]
}

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

export function DatabaseList({ databases }: DatabaseListProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Bancos de Dados</CardTitle>
          <CardDescription>Bancos cadastrados no sistema</CardDescription>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <DatabaseIcon className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {databases.map((db) => (
            <div
              key={db.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <DatabaseIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {db.name}
                    </p>
                    {!db.isActive && (
                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-xs">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className={typeColors[db.type]}>
                      {typeLabels[db.type]}
                    </Badge>
                    {db.lastBackup && (
                      <span className="text-xs text-muted-foreground">
                        Último backup:{" "}
                        {formatDistanceToNow(db.lastBackup, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-1">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      db.successRate >= 95
                        ? "bg-success"
                        : db.successRate >= 80
                        ? "bg-warning"
                        : "bg-destructive"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {db.successRate.toFixed(0)}%
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Play className="mr-2 h-4 w-4" />
                      Executar backup
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Plug className="mr-2 h-4 w-4" />
                      Testar conexão
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
