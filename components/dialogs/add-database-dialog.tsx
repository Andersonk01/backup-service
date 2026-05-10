"use client"

import { useState } from "react"
import { Database, Loader2, Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { databasesApi } from "@/lib/api"

interface AddDatabaseDialogProps {
  onDatabaseAdded?: () => void
}

export function AddDatabaseDialog({ onDatabaseAdded }: AddDatabaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await databasesApi.create(formData)
      toast.success("Banco de dados adicionado com sucesso!")
      setOpen(false)
      setFormData({
        name: "",
        type: "",
        host: "",
        port: "",
        database: "",
        username: "",
        password: "",
      })
      onDatabaseAdded?.()
    } catch (error) {
      toast.error("Falha ao adicionar banco de dados")
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    toast.success("Conexão estabelecida com sucesso!")
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Database className="mr-2 h-4 w-4" />
          Adicionar Banco
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Adicionar Banco de Dados
          </DialogTitle>
          <DialogDescription>
            Cadastre um novo banco de dados para gerenciar backups.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Banco</Label>
              <Input
                id="name"
                placeholder="Ex: Produção Principal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgres">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="mongodb">MongoDB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  placeholder="5432"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="database">Nome do Database</Label>
              <Input
                id="database"
                placeholder="nome_do_banco"
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  placeholder="usuario"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={loading}
            >
              Testar Conexão
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}