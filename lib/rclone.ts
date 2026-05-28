import path from "path"
import fs from "fs"
import { spawn } from "child_process"
import type {
  RemoteInfo,
  ProviderInfo,
  RemoteOption,
  StorageUsage,
  TestResult,
  UploadResult,
  RcloneConfig,
} from "./rclone-types"

function getRcloneBinary(): string {
  if (process.env.RCLONE_EXECUTABLE) return process.env.RCLONE_EXECUTABLE
  return path.resolve(
    process.cwd(),
    "node_modules",
    "rclone.js",
    "bin",
    `rclone${process.platform === "win32" ? ".exe" : ""}`
  )
}

function getConfigPath(): string {
  return (
    process.env.RCLONE_CONFIG_PATH ||
    path.join(process.cwd(), "data", "rclone.conf")
  )
}

function getRcloneEnv(): Record<string, string> {
  return {
    ...process.env,
    RCLONE_CONFIG: getConfigPath(),
  } as Record<string, string>
}

function ensureConfigDir(): void {
  const configPath = getConfigPath()
  const dir = path.dirname(configPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function runRcloneCommand(
  ...args: (string | number | boolean | Record<string, unknown>)[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = getRcloneEnv()

    const stringArgs: string[] = []
    let childOptions: Record<string, unknown> = { env }

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (typeof arg === "object" && arg !== null && !Array.isArray(arg)) {
        childOptions = { ...childOptions, ...arg }
      } else {
        stringArgs.push(String(arg))
      }
    }

    const child = spawn(getRcloneBinary(), stringArgs, childOptions)

    const stdout: Buffer[] = []
    const stderr: Buffer[] = []

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk))
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk))

    child.on("error", reject)

    child.on("close", (code) => {
      const stderrStr = Buffer.concat(stderr).toString("utf-8").trim()
      if (code === 0) {
        resolve(Buffer.concat(stdout).toString("utf-8").trim())
      } else {
        reject(new Error(stderrStr || `rclone exited with code ${code}`))
      }
    })
  })
}

export async function listRemotes(): Promise<RemoteInfo[]> {
  ensureConfigDir()

  try {
    const output = await runRcloneCommand("config", "dump")
    if (!output || output === "{}") return []

    const config: RcloneConfig = JSON.parse(output)
    return Object.entries(config).map(([name, opts]) => ({
      name,
      type: opts.type || "unknown",
      config: Object.fromEntries(
        Object.entries(opts).filter(([k]) => k !== "type")
      ),
    }))
  } catch {
    return []
  }
}

export async function getRemote(name: string): Promise<RemoteInfo | null> {
  ensureConfigDir()

  try {
    const output = await runRcloneCommand("config", "show", name)
    if (!output) return null

    const config: RcloneConfig = JSON.parse(output)
    const remote = config[name]
    if (!remote) return null

    return {
      name,
      type: remote.type || "unknown",
      config: Object.fromEntries(
        Object.entries(remote).filter(([k]) => k !== "type")
      ),
    }
  } catch {
    return null
  }
}

function readConfigFile(): Record<string, Record<string, string>> {
  const configPath = getConfigPath()
  ensureConfigDir()

  if (!fs.existsSync(configPath)) return {}

  const content = fs.readFileSync(configPath, "utf-8")
  const result: Record<string, Record<string, string>> = {}
  let currentSection: string | null = null

  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue

    const sectionMatch = trimmed.match(/^\[(.+)\]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      result[currentSection] = {}
      continue
    }

    if (currentSection) {
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim()
        const value = trimmed.substring(eqIdx + 1).trim()
        result[currentSection][key] = value
      }
    }
  }

  return result
}

function writeConfigFile(config: Record<string, Record<string, string>>): void {
  const configPath = getConfigPath()
  ensureConfigDir()

  const lines: string[] = []
  for (const [section, values] of Object.entries(config)) {
    lines.push(`[${section}]`)
    for (const [key, value] of Object.entries(values)) {
      lines.push(`${key} = ${value}`)
    }
    lines.push("")
  }

  fs.writeFileSync(configPath, lines.join("\n"), "utf-8")
}

export async function createRemote(
  name: string,
  type: string,
  config: Record<string, string>
): Promise<void> {
  const current = readConfigFile()
  current[name] = { type, ...config }
  writeConfigFile(current)
}

export async function updateRemote(
  name: string,
  config: Record<string, string>
): Promise<void> {
  const current = readConfigFile()
  if (!current[name]) throw new Error(`Remote "${name}" not found`)
  current[name] = { ...current[name], ...config }
  writeConfigFile(current)
}

export async function deleteRemote(name: string): Promise<void> {
  const current = readConfigFile()
  delete current[name]
  writeConfigFile(current)
}

export async function testRemote(name: string): Promise<TestResult> {
  ensureConfigDir()

  try {
    const output = await runRcloneCommand("lsd", `${name}:`, "--max-depth", 1)
    return { success: true, message: output || "Conexão estabelecida" }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return { success: false, message: msg }
  }
}

export async function getStorageUsage(remoteName: string): Promise<StorageUsage | null> {
  ensureConfigDir()

  try {
    const output = await runRcloneCommand("about", `${remoteName}:`, "--json")
    const data = JSON.parse(output)
    return {
      used: data.used || 0,
      total: data.total || 0,
      free: data.free || 0,
      truncated: data.truncated || false,
    }
  } catch {
    return null
  }
}

export async function uploadFile(
  localPath: string,
  destRemote: string,
  destPath: string
): Promise<UploadResult> {
  ensureConfigDir()

  const dest = `${destRemote}:${destPath}`

  try {
    await runRcloneCommand("mkdir", dest)
    await runRcloneCommand("copy", localPath, dest)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

function normalizeProvider(raw: Record<string, unknown>): ProviderInfo {
  return {
    name: (raw.Name || raw.name || "") as string,
    description: (raw.Description || raw.description || "") as string,
    prefix: (raw.Prefix || raw.prefix || "") as string,
    options: ((raw.Options || raw.options || []) as Record<string, unknown>[]).map(normalizeOption),
  }
}

function normalizeOption(raw: Record<string, unknown>): RemoteOption {
  return {
    name: (raw.Name || raw.name || "") as string,
    help: (raw.Help || raw.help || "") as string,
    provider: (raw.Provider || raw.provider || "") as string,
    default: (raw.Default || raw.default || "") as string,
    value: (raw.Value || raw.value || "") as string,
    examples: ((raw.Examples || raw.examples || []) as { Value?: string; Help?: string; value?: string; help?: string }[]).map((ex) => ({
      value: ex.Value || ex.value || "",
      help: ex.Help || ex.help || "",
    })),
    required: !!(raw.Required || raw.required),
    advanced: !!(raw.Advanced || raw.advanced),
  }
}

export async function getProviders(): Promise<ProviderInfo[]> {
  try {
    const output = await runRcloneCommand("config", "providers")
    const raw: Record<string, unknown>[] = JSON.parse(output)
    return raw.map(normalizeProvider)
  } catch {
    return []
  }
}

export async function getProviderOptions(type: string): Promise<RemoteOption[]> {
  try {
    const providers = await getProviders()
    const provider = providers.find((p) => p.name === type)
    return provider?.options || []
  } catch {
    return []
  }
}

export async function configFile(): Promise<string> {
  try {
    const output = await runRcloneCommand("config", "file")
    return output
  } catch {
    return getConfigPath()
  }
}

export { getConfigPath }

export interface FileEntry {
  name: string
  path: string
  size: number
  modTime: string
  isDir: boolean
}

export async function listFiles(remoteName: string, remotePath: string): Promise<FileEntry[]> {
  const fullPath = `${remoteName}:${remotePath}`
  try {
    const output = await runRcloneCommand("lsjson", fullPath)
    const data: { Path: string; Name: string; Size: number; ModTime: string; IsDir: boolean }[] = JSON.parse(output || "[]")
    return data.map((f) => ({
      name: f.Name || f.Path.split("/").pop() || "",
      path: `/${remotePath ? remotePath + "/" : ""}${f.Path || f.Name}`.replace(/\/+/g, "/"),
      size: f.Size,
      modTime: f.ModTime,
      isDir: f.IsDir,
    }))
  } catch {
    return []
  }
}

export async function deleteFile(remoteName: string, remotePath: string, isDir: boolean): Promise<void> {
  const fullPath = `${remoteName}:${remotePath}`
  if (isDir) {
    await runRcloneCommand("purge", fullPath)
  } else {
    await runRcloneCommand("deletefile", fullPath)
  }
}

export async function createDir(remoteName: string, remotePath: string): Promise<void> {
  await runRcloneCommand("mkdir", `${remoteName}:${remotePath}`)
}

export async function renameItem(remoteName: string, fromPath: string, toPath: string): Promise<void> {
  await runRcloneCommand("moveto", `${remoteName}:${fromPath}`, `${remoteName}:${toPath}`)
}

export async function downloadFile(remoteName: string, remotePath: string): Promise<{ data: Buffer; name: string }> {
  const output = await runRcloneCommand("cat", `${remoteName}:${remotePath}`)
  const name = remotePath.split("/").pop() || "download"
  return { data: Buffer.from(output, "utf-8"), name }
}

export async function uploadFileToRemote(remoteName: string, localPath: string, destPath: string): Promise<UploadResult> {
  const dest = `${remoteName}:${destPath}`
  try {
    await runRcloneCommand("mkdir", dest)
    await runRcloneCommand("copy", localPath, dest)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
