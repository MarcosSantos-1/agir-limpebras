"use client";

import {
  BarChart3,
  CalendarDays,
  History,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  Menu,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/pontos", label: "Pontos", icon: MapPin },
  { href: "/galeria", label: "Galeria", icon: ImageIcon },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/indicadores", label: "Indicadores", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200/80 bg-white shadow-agir transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-zinc-100 px-4">
          <Image
            src="/AGIR_logo.svg"
            alt="AGIR"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">AGIR</p>
            <p className="truncate text-xs text-muted-foreground">
              {profile ? roleLabel(profile.role) : "—"}
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard" || pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "agir-gradient text-white shadow-md"
                    : "text-zinc-700 hover:bg-zinc-100"
                )}
              >
                <Icon className="size-4 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-100 p-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 rounded-xl"
            type="button"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </aside>
      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="flex min-h-screen flex-1 flex-col md:pl-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-zinc-200/80 bg-zinc-50/95 px-4 backdrop-blur md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-semibold">AGIR</span>
        </header>
        <main className="flex flex-1 flex-col p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
