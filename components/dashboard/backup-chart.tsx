"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BackupChartProps {
  data: Array<{ date: string; success: number; failed: number }>
}

export function BackupChart({ data }: BackupChartProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Histórico de Backups</CardTitle>
        <CardDescription>Últimos 7 dias de execuções</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span style={{ color: "var(--foreground)" }}>
                    {value === "success" ? "Sucesso" : "Falha"}
                  </span>
                )}
              />
              <Bar
                dataKey="success"
                fill="var(--success)"
                radius={[4, 4, 0, 0]}
                name="success"
              />
              <Bar
                dataKey="failed"
                fill="var(--destructive)"
                radius={[4, 4, 0, 0]}
                name="failed"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
