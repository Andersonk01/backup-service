"use client"

import { useState } from "react"
import { Play, Loader2, Database } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { mockDatabases } from "@/lib/mock-data"

export function RunBackupDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedDatabase, setSelectedDatabase] = useState("")
  const [skipRetention, setSkipRetention] = useState(false)

  const handleRunBackup = async () => {
    if (!selectedDatabase) {
      toast.error("Selecione um banco de dados")
      return
    }

    setLoading(true)
    
    // Simular execução
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    const db = mockDatabases.find((d) => d.id === selectedDatabase)
    toast.success(`Backup iniciado para ${db?.name}!`)
    setOpen(false)
    setLoading(false)
    setSelectedDatabase("")
    setSkipRetention(false)
  }

  const activeDatabases = mockDatabases.filter((db) => db.isActive)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Play className="mr-2 h-4 w-4" />
          Executar Backup
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Executar Backup Manual
          </DialogTitle>
          <DialogDescription>
            Execute um backup imediatamente para o banco selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="database">Banco de Dados</Label>
            <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um banco" />
              </SelectTrigger>
              <SelectContent>
                {activeDatabases.map((db) => (
                  <SelectItem key={db.id} value={db.id}>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span>{db.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({db.type})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="skipRetention"
              checked={skipRetention}
              onCheckedChange={(checked) => setSkipRetention(checked as boolean)}
            />
            <Label htmlFor="skipRetention" className="text-sm font-normal cursor-pointer">
              Ignorar política de retenção (manter backup permanentemente)
            </Label>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="text-muted-foreground">
              O backup será executado imediatamente e você poderá acompanhar o progresso na seção de histórico.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleRunBackup} disabled={loading || !selectedDatabase}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Executar Agora
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
