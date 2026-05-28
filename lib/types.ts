export type DatabaseType = 'postgres' | 'mysql' | 'mongodb'

export type BackupFrequency = 'hourly' | 'daily' | 'weekly'

export type BackupStatus = 'pending' | 'running' | 'success' | 'failed'

export interface Database {
  id: string
  name: string
  type: DatabaseType
  connectionUrl: string
  isActive: boolean
  createdAt: Date
  lastBackup?: Date
  successRate: number
}

export interface BackupJob {
  id: string
  databaseId: string
  frequency: BackupFrequency
  time: string
  retentionDays: number
  isActive: boolean
  nextRun?: Date
  destination: string
}

export interface BackupRun {
  id: string
  databaseId: string
  databaseName: string
  status: BackupStatus
  filePath?: string
  size?: number
  startedAt: Date
  finishedAt?: Date
  error?: string
  duration?: number
}

export interface DashboardStats {
  totalDatabases: number
  activeDatabases: number
  totalBackups: number
  successfulBackups: number
  failedBackups: number
  totalStorage: number
  averageBackupTime: number
  lastBackupTime?: Date
}
