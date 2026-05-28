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

export interface AppSettings {
  defaultRemote: string
  storageBackupPath: string
}

export const settingsApi = {
  async get(): Promise<AppSettings> {
    const res = await fetch('/api/settings')
    if (!res.ok) throw new Error('Failed to fetch settings')
    return res.json()
  },

  async save(data: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save settings')
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

  async toggle(id: string, isActive: boolean): Promise<BackupJob> {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    if (!res.ok) throw new Error('Failed to toggle')
    return res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete')
  },
}

export const statsApi = {
  async get(): Promise<DashboardStats> {
    const res = await fetch('/api/stats')
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },
}

export interface RemoteInfo {
  name: string
  type: string
  config: Record<string, string>
}

export interface StorageUsage {
  used: number
  total: number
  free: number
  truncated: boolean
}

export interface TestResult {
  success: boolean
  message: string
}

export interface StartOAuthResponse {
  state: string
  auth_url: string
}

export interface OAuthStatusResponse {
  status: "pending" | "success" | "error" | "expired"
  token?: string
  error?: string
}

export const oauthApi = {
  async start(): Promise<StartOAuthResponse> {
    const res = await fetch("/api/storage/oauth/start", {
      method: "POST",
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Falha ao iniciar OAuth" }))
      throw new Error(err.error || "Falha ao iniciar OAuth")
    }
    return res.json()
  },

  async checkStatus(state: string): Promise<OAuthStatusResponse> {
    const res = await fetch(`/api/storage/oauth/status?state=${encodeURIComponent(state)}`)
    if (!res.ok) throw new Error("Falha ao verificar status")
    return res.json()
  },
}

export const storageApi = {
  async getRemotes(): Promise<{ remotes: RemoteInfo[]; providers: unknown[] }> {
    const res = await fetch('/api/storage/remotes')
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },

  async createRemote(name: string, type: string, config: Record<string, string>): Promise<void> {
    const res = await fetch('/api/storage/remotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, config }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to create remote')
    }
  },

  async getRemote(name: string): Promise<RemoteInfo> {
    const res = await fetch(`/api/storage/remotes/${encodeURIComponent(name)}`)
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },

  async deleteRemote(name: string): Promise<void> {
    const res = await fetch(`/api/storage/remotes/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete')
  },

  async testRemote(name: string): Promise<TestResult> {
    const res = await fetch(`/api/storage/remotes/${encodeURIComponent(name)}/test`, {
      method: 'POST',
    })
    return res.json()
  },

  async getUsage(): Promise<StorageUsage & { remotes: RemoteInfo[] }> {
    const res = await fetch('/api/storage/usage')
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },

  async uploadFile(localPath: string, remote: string, remotePath: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localPath, remote, remotePath }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Upload failed')
    }
    return res.json()
  },
}

export interface FileEntry {
  name: string
  path: string
  size: number
  modTime: string
  isDir: boolean
}

export interface FileListResponse {
  files: FileEntry[]
  path: string
}

export const fileApi = {
  async list(remoteName: string, path: string): Promise<FileListResponse> {
    const res = await fetch(`/api/storage/remote/${encodeURIComponent(remoteName)}/files?path=${encodeURIComponent(path)}`)
    if (!res.ok) throw new Error("Falha ao listar arquivos")
    return res.json()
  },

  async _delete(remoteName: string, remotePath: string, isDir: boolean): Promise<void> {
    const res = await fetch(
      `/api/storage/remote/${encodeURIComponent(remoteName)}/files?path=${encodeURIComponent(remotePath)}&dir=${isDir}`,
      { method: "DELETE" }
    )
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Falha ao deletar")
    }
  },

  async mkdir(remoteName: string, remotePath: string): Promise<void> {
    const res = await fetch(`/api/storage/remote/${encodeURIComponent(remoteName)}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mkdir", remotePath }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Falha ao criar pasta")
    }
  },

  async rename(remoteName: string, remotePath: string, newName: string): Promise<void> {
    const res = await fetch(`/api/storage/remote/${encodeURIComponent(remoteName)}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", remotePath, newName }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Falha ao renomear")
    }
  },

  async download(remoteName: string, remotePath: string): Promise<Blob> {
    const res = await fetch(
      `/api/storage/remote/${encodeURIComponent(remoteName)}/files?path=${encodeURIComponent(remotePath)}&download=true`
    )
    if (!res.ok) throw new Error("Falha no download")
    return res.blob()
  },

  async upload(remoteName: string, file: File, destPath: string): Promise<void> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("path", destPath)
    const res = await fetch(`/api/storage/remote/${encodeURIComponent(remoteName)}/files`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Falha no upload")
    }
  },
}
