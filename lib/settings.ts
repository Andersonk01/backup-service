import fs from "fs"
import path from "path"

export interface AppSettings {
  defaultRemote: string
  storageBackupPath: string
}

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json")

const defaults: AppSettings = {
  defaultRemote: "",
  storageBackupPath: "/backups",
}

export function getSettings(): AppSettings {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return { ...defaults }
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8")
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function saveSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated = { ...current, ...partial }

  const dir = path.dirname(SETTINGS_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), "utf-8")
  return updated
}
