"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface StorageItem {
  name: string
  size: number
  percentage: number
}

interface StorageCardProps {
  data: StorageItem[]
  totalUsed: number
  totalLimit?: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

const colors = [
  "bg-primary",
  "bg-info",
  "bg-warning",
  "bg-success",
  "bg-destructive",
]

export function StorageCard({ data, totalUsed, totalLimit = 21474836480 }: StorageCardProps) {
  const usedPercentage = (totalUsed / totalLimit) * 100

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Uso de Armazenamento</CardTitle>
        <CardDescription>Distribuição por banco de dados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Usado</span>
            <span className="font-medium text-foreground">
              {formatBytes(totalUsed)} / {formatBytes(totalLimit)}
            </span>
          </div>
          <Progress value={usedPercentage} className="h-2" />
        </div>

        {/* Per-database breakdown */}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${colors[index % colors.length]}`} />
                  <span className="text-foreground">{item.name}</span>
                </div>
                <span className="text-muted-foreground">{formatBytes(item.size)}</span>
              </div>
              <Progress
                value={item.percentage}
                className="h-1.5"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
