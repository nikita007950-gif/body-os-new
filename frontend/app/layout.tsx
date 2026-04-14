"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Dumbbell,
  Flag,
  History,
  Menu,
  Utensils,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Дашборд", icon: Activity },
  { href: "/workouts", label: "Тренировки", icon: Dumbbell },
  { href: "/nutrition", label: "Питание", icon: Utensils },
  { href: "/history", label: "История", icon: History },
  { href: "/goals", label: "Цели", icon: Flag },
];

export default function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <html lang="ru">
      <body className="bg-[#f8f7fb] text-gray-900">
        <div className="min-h-screen md:flex">
          <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">
            <div className="border-b border-gray-100 px-6 py-6">
              <div className="text-4xl font-bold tracking-tight text-gray-900">
                Body OS
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Операционная система тела
              </p>
            </div>

            <nav className="flex-1 space-y-2 px-4 py-6">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-pink-500 text-white shadow-sm"
                        : "text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4">
              <div className="rounded-3xl border border-pink-100 bg-pink-50 p-4">
                <div className="text-sm font-semibold text-pink-700">
                  Фокус недели
                </div>
                <div className="mt-2 text-sm leading-6 text-gray-600">
                  Стабильно закрывать PPL-цикл и фиксировать факт по повторам и
                  весам.
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur md:hidden">
              <div>
                <div className="text-2xl font-bold tracking-tight text-gray-900">
                  Body OS
                </div>
                <div className="text-sm text-gray-500">Тренировки и прогресс</div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-2xl border border-gray-200 bg-white p-3 text-gray-700 shadow-sm"
              >
                <Menu className="h-6 w-6" />
              </button>
            </header>

            {mobileMenuOpen && (
              <div className="fixed inset-0 z-40 md:hidden">
                <div
                  className="absolute inset-0 bg-black/30"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="absolute right-0 top-0 h-full w-72 border-l border-gray-200 bg-white p-5 shadow-xl">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        Body OS
                      </div>
                      <div className="text-sm text-gray-500">
                        Навигация
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-2xl border border-gray-200 p-2 text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <nav className="space-y-2">
                    {navItems.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href;
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            active
                              ? "bg-pink-500 text-white"
                              : "text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            )}

            <main className="mx-auto max-w-[1400px] px-4 py-4 md:px-6 md:py-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}