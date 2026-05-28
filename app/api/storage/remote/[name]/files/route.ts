import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { randomBytes } from "crypto"
import { listFiles, deleteFile, createDir, renameItem, downloadFile, uploadFileToRemote } from "@/lib/rclone"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const remotePath = req.nextUrl.searchParams.get("path") || ""
  const download = req.nextUrl.searchParams.get("download") === "true"

  if (download && remotePath) {
    try {
      const { data, name: fileName } = await downloadFile(name, remotePath)
      return new NextResponse(new Uint8Array(data), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Falha no download" },
        { status: 500 }
      )
    }
  }

  try {
    const files = await listFiles(name, remotePath)
    return NextResponse.json({ files, path: remotePath })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao listar arquivos" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  try {
    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("file") as File | null
      const destPath = formData.get("path") as string || ""

      if (!file) {
        return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
      }

      const tmpDir = path.join(process.cwd(), "data", "tmp")
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

      const tmpName = `${randomBytes(8).toString("hex")}-${file.name}`
      const tmpPath = path.join(tmpDir, tmpName)
      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(tmpPath, buffer)

      const result = await uploadFileToRemote(name, tmpPath, destPath)

      try { fs.unlinkSync(tmpPath) } catch {}

      if (result.success) {
        return NextResponse.json({ success: true, name: file.name })
      }
      return NextResponse.json({ error: result.error || "Falha no upload" }, { status: 500 })
    }

    const body = await req.json()
    const { action, remotePath, newName } = body

    if (action === "mkdir") {
      await createDir(name, remotePath)
      return NextResponse.json({ success: true })
    }

    if (action === "rename") {
      await renameItem(name, remotePath, newName)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha na operação" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const remotePath = req.nextUrl.searchParams.get("path") || ""
  const isDir = req.nextUrl.searchParams.get("dir") === "true"

  if (!remotePath) {
    return NextResponse.json({ error: "path é obrigatório" }, { status: 400 })
  }

  try {
    await deleteFile(name, remotePath, isDir)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao deletar" },
      { status: 500 }
    )
  }
}
