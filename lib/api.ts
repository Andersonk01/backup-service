import type { Database, BackupJob, BackupRun, DashboardStats } from './types'

export type DatabaseType = 'postgres' | 'mysql' | 'mongodb'
export type BackupFrequency = 'hourly' | 'daily' | 'weekly'
export type BackupStatus = 'pending' | 'running' | 'success' | 'failed'

export const databasesApi = {
  async getAll(): Promise<Database[]> {
    const res = await fetch('/api/databases')
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },

  async create(data: {
    name: string
    type: string
    host: string
    port: string
    database: string
    username: string
    password: string
  }): Promise<Database> {
    const res = await fetch('/api/databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create')
    return res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/databases/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete')
  },

  async toggle(id: string, isActive: boolean): Promise<Database> {
    const res = await fetch(`/api/databases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    if (!res.ok) throw new Error('Failed to update')
    return res.json()
  },
}

export const runsApi = {
  async getAll(): Promise<BackupRun[]> {
    const res = await fetch('/api/runs')
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },

  async create(databaseId: string): Promise<BackupRun> {
    const res = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ databaseId }),
    })
    if (!res.ok) throw new Error('Failed to create')
    return res.json()
  },

  async cleanupStuck(): Promise<{ cleaned: number }> {
    const res = await fetch('/api/runs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cleanup-stuck' }),
    })
    if (!res.ok) throw new Error('Failed to cleanup')
    return res.json()
  },

  async cleanupMissingFiles(): Promise<{ cleaned: number }> {
    const res = await fetch('/api/runs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cleanup-missing-files' }),
    })
    if (!res.ok) throw new Error('Failed to cleanup')
    return res.json()
  },
}

export const jobsApi = {
  async getAll(): Promise<BackupJob[]> {
    const res = await fetch('/api/jobs')
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },

  async create(data: {
    databaseId: string
    frequency: string
    time: string
    retentionDays: number
  }): Promise<BackupJob> {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create')
    return res.json()
  },
}

export const statsApi = {
  async get(): Promise<DashboardStats> {
    const res = await fetch('/api/stats')
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },
}