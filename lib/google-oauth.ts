import path from "path"
import os from "os"
import { spawn, type ChildProcess } from "child_process"
import { randomBytes } from "crypto"
import fs from "fs"

interface OAuthSession {
  process: ChildProcess | null
  token: string | null
  error: string | null
  expiresAt: number
}

const sessions = new Map<string, OAuthSession>()
const TIMEOUT = 5 * 60 * 1000

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
    path.join(os.tmpdir(), "backup-service-rclone.conf")
  )
}

function ensureConfigDir(): void {
  const dir = path.dirname(getConfigPath())
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  }
}

export interface StartOAuthResult {
  state: string
  auth_url: string
}

export async function startOAuth(): Promise<StartOAuthResult> {
  const state = randomBytes(16).toString("hex")

  ensureConfigDir()

  return new Promise((resolve, reject) => {
    const binary = getRcloneBinary()
    const configPath = getConfigPath()

    const child = spawn(binary, ["authorize", "drive", "--auth-no-open-browser"], {
      env: { ...process.env, RCLONE_CONFIG: configPath } as NodeJS.ProcessEnv,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""
    let resolved = false

    const urlTimeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        child.kill()
        reject(new Error("Tempo limite aguardando URL de autenticação"))
      }
    }, 5000)

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString()
    })

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
      if (resolved) return

      const urlMatch = stderr.match(
        /http:\/\/127\.0\.0\.1:\d+\/auth\?[^\s"]+/
      )

      if (urlMatch) {
        resolved = true
        clearTimeout(urlTimeout)

        const session: OAuthSession = {
          process: child,
          token: null,
          error: null,
          expiresAt: Date.now() + TIMEOUT,
        }
        sessions.set(state, session)

        resolve({ state, auth_url: urlMatch[0] })
      }
    })

    child.on("error", (err) => {
      if (!resolved) {
        resolved = true
        clearTimeout(urlTimeout)
        reject(err)
      }
    })

    child.on("close", (code) => {
      clearTimeout(urlTimeout)

      if (resolved) {
        const session = sessions.get(state)
        if (!session) return
        session.process = null

        if (code === 0) {
          const jsonMatch = stdout.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0])
              session.token = JSON.stringify(parsed)
            } catch {
              session.error = "Erro ao processar token do rclone"
            }
          } else {
            session.error = "Token não encontrado na resposta do rclone"
          }
        } else {
          const msg = stderr
            .split("\n")
            .filter((l) => !l.includes("If your browser") && l.trim())
            .pop()
          session.error = msg || `rclone falhou (código ${code})`
        }
      } else {
        const msg = stderr
          .split("\n")
          .filter((l) => !l.includes("If your browser") && l.trim())
          .pop()
        reject(new Error(msg || `rclone falhou (código ${code})`))
      }
    })
  })
}

export interface OAuthStatusResult {
  status: "pending" | "success" | "error" | "expired"
  token?: string
  error?: string
}

export function checkOAuthStatus(state: string): OAuthStatusResult {
  const session = sessions.get(state)

  if (!session) {
    return { status: "expired", error: "Sessão expirada ou inválida" }
  }

  if (session.token) {
    sessions.delete(state)
    return { status: "success", token: session.token }
  }

  if (session.error) {
    sessions.delete(state)
    return { status: "error", error: session.error }
  }

  if (Date.now() > session.expiresAt) {
    if (session.process) {
      try {
        session.process.kill()
      } catch {}
    }
    sessions.delete(state)
    return { status: "expired", error: "Tempo excedido. Tente novamente." }
  }

  return { status: "pending" }
}
