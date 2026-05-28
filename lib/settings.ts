import { prisma } from "@/lib/prisma"

export interface AppSettings {
  defaultRemote: string
  storageBackupPath: string
}

const defaults: AppSettings = {
  defaultRemote: "",
  storageBackupPath: "/backups",
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const cfg = await prisma.appConfig.findUnique({ where: { id: "singleton" } })
    if (!cfg) return { ...defaults }
    return { ...defaults, ...(cfg.data as Partial<AppSettings>) }
  } catch {
    return { ...defaults }
  }
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings()
  const updated = { ...current, ...partial }

  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: { data: updated as any },
    create: { id: "singleton", data: updated as any },
  })

  return updated
}
