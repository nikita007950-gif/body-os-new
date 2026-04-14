"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dumbbell,
  History,
  LayoutDashboard,
  Menu,
  Target,
  Utensils,
  X,
} from "lucide-react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <html lang="ru">
      <body className="bg-[#07111f] text-white">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.06),_transparent_25%),linear-gradient(180deg,#07111f_0%,#091423_100%)]">
          <div className="flex min-h-screen">
            {isOpen && (
              <button
                aria-label="Закрыть меню"
                className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                onClick={() => setIsOpen(false)}
              />
            )}

            <aside
              className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/10 bg-[#08101d] p-5 transition-transform duration-300 lg:static lg:translate-x-0 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="text-2xl font-semibold tracking-tight">
                    Body OS
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    Операционная система тела
                  </p>
                </div>

                <button
                  aria-label="Закрыть меню"
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 lg:hidden"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-2">
                <NavItem
                  href="/dashboard"
                  icon={LayoutDashboard}
                  label="Дашборд"
                  active={pathname === "/dashboard"}
                />
                <NavItem
                  href="/workouts"
                  icon={Dumbbell}
                  label="Тренировки"
                  active={pathname === "/workouts"}
                />
                <NavItem
                  href="/nutrition"
                  icon={Utensils}
                  label="Питание"
                  active={pathname === "/nutrition"}
                />
                <NavItem
                  href="/history"
                  icon={History}
                  label="История"
                  active={pathname === "/history"}
                />
                <NavItem
                  href="/goals"
                  icon={Target}
                  label="Цели"
                  active={pathname === "/goals"}
                />
              </nav>

              <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <div className="text-sm font-medium text-cyan-200">
                  Фокус недели
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  Стабильно закрывать PPL-цикл и фиксировать факт по повторам и
                  весам.
                </div>
              </div>
            </aside>

            <main className="min-w-0 flex-1">
              <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/80 backdrop-blur lg:hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-lg font-semibold">Body OS</div>
                    <div className="text-xs text-slate-400">
                      Тренировки и прогресс
                    </div>
                  </div>

                  <button
                    aria-label="Открыть меню"
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200"
                    onClick={() => setIsOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </div>
              </header>

              <div className="p-4 sm:p-5 lg:p-6">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
        active
          ? "bg-cyan-400 text-slate-950"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}