declare module "rclone.js" {
  import { ChildProcess } from "child_process"

  interface RcloneFlags {
    [key: string]: unknown
    cwd?: string
    env?: Record<string, string>
    argv0?: string
    stdio?: string | string[]
    detached?: boolean
    uid?: number
    gid?: number
    shell?: string | boolean
    timeout?: number
    killSignal?: string
  }

  interface RcloneAPI {
    (...args: (string | number | boolean | RcloneFlags)[]): ChildProcess

    promises: {
      (...args: (string | number | boolean | RcloneFlags)[]): Promise<Buffer>
      about(...args: (string | RcloneFlags)[]): Promise<Buffer>
      authorize(...args: (string | RcloneFlags)[]): Promise<Buffer>
      "config create"(...args: (string | RcloneFlags)[]): Promise<Buffer>
      "config delete"(...args: (string | RcloneFlags)[]): Promise<Buffer>
      "config dump"(...args: (string | RcloneFlags)[]): Promise<Buffer>
      "config file"(...args: (string | RcloneFlags)[]): Promise<Buffer>
      "config providers"(...args: (string | RcloneFlags)[]): Promise<Buffer>
      "config show"(...args: (string | RcloneFlags)[]): Promise<Buffer>
      "config update"(...args: (string | RcloneFlags)[]): Promise<Buffer>
      "config userinfo"(...args: (string | RcloneFlags)[]): Promise<Buffer>
      copy(...args: (string | RcloneFlags)[]): Promise<Buffer>
      ls(...args: (string | RcloneFlags)[]): Promise<Buffer>
      mkdir(...args: (string | RcloneFlags)[]): Promise<Buffer>
      listremotes(...args: (string | RcloneFlags)[]): Promise<Buffer>
      size(...args: (string | RcloneFlags)[]): Promise<Buffer>
      about(...args: (string | RcloneFlags)[]): Promise<Buffer>
      version(...args: (string | RcloneFlags)[]): Promise<Buffer>
      obscure(...args: (string | RcloneFlags)[]): Promise<Buffer>
      [cmd: string]: (...args: unknown[]) => Promise<Buffer>
    }

    about(...args: (string | RcloneFlags)[]): ChildProcess
    authorize(...args: (string | RcloneFlags)[]): ChildProcess
    "config create"(...args: (string | RcloneFlags)[]): ChildProcess
    "config delete"(...args: (string | RcloneFlags)[]): ChildProcess
    "config dump"(...args: (string | RcloneFlags)[]): ChildProcess
    "config providers"(...args: (string | RcloneFlags)[]): ChildProcess
    "config show"(...args: (string | RcloneFlags)[]): ChildProcess
    "config update"(...args: (string | RcloneFlags)[]): ChildProcess
    copy(...args: (string | RcloneFlags)[]): ChildProcess
    mkdir(...args: (string | RcloneFlags)[]): ChildProcess
    listremotes(...args: (string | RcloneFlags)[]): ChildProcess
    [cmd: string]: (...args: unknown[]) => ChildProcess
  }

  const api: RcloneAPI
  export default api
}
