"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Database,
  LayoutDashboard,
  History,
  Settings,
  Calendar,
  HardDrive,
  Activity,
  Shield,
  FolderTree,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Bancos de Dados", href: "/databases", icon: Database },
  { name: "Jobs de Backup", href: "/jobs", icon: Calendar },
  { name: "Histórico", href: "/history", icon: History },
  { name: "Armazenamento", href: "/storage", icon: HardDrive },
  { name: "Arquivos", href: "/storage/explorer", icon: FolderTree },
]

const secondaryNavigation = [
  { name: "Atividade", href: "/activity", icon: Activity },
  { name: "Segurança", href: "/security", icon: Shield },
  { name: "Configurações", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar border-r border-sidebar-border px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Database className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">BackupOrchestrator</span>
            <span className="text-xs text-muted-foreground">v1.0.0</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors",
                        pathname === item.href
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          pathname === item.href
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* Secondary Navigation */}
            <li>
              <div className="text-xs font-semibold leading-6 text-muted-foreground uppercase tracking-wider">
                Sistema
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {secondaryNavigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors",
                        pathname === item.href
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          pathname === item.href
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* Status */}
            <li className="mt-auto">
              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-foreground">Worker Ativo</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Última verificação: há 2 min
                </p>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  )
}
