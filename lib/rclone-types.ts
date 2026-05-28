export interface RemoteInfo {
  name: string
  type: string
  config: Record<string, string>
}

export interface ProviderInfo {
  name: string
  description: string
  prefix: string
  options: RemoteOption[]
}

export interface RemoteOption {
  name: string
  help: string
  provider: string
  default: string
  value: string
  examples: { value: string; help: string }[]
  required: boolean
  advanced: boolean
}

export interface StorageUsage {
  used: number
  total: number
  free: number
  truncated: boolean
}

export interface UploadResult {
  success: boolean
  error?: string
}

export interface TestResult {
  success: boolean
  message: string
}

export interface RcloneConfig {
  [remoteName: string]: {
    type: string
    [key: string]: string
  }
}
