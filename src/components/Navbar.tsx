"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, Landmark, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Tabwib & Fatwa", icon: BookOpen },
  { href: "/pustaka-pdf", label: "Pustaka PDF", icon: FileText },
  { href: "/forum", label: "Munas & Sumber", icon: Landmark },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3 focus:outline-none"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b4f8c] to-[#083560] shadow-sm ring-1 ring-[#d49b2a]/40 transition-transform group-hover:scale-105">
            <svg
              viewBox="0 0 64 64"
              className="h-7 w-7"
              fill="none"
              aria-hidden="true"
            >
              <g stroke="#f2c96b" strokeWidth="2.8" strokeLinecap="round">
                <line x1="32" y1="7" x2="32" y2="14" />
                <line x1="32" y1="50" x2="32" y2="57" />
                <line x1="7" y1="32" x2="14" y2="32" />
                <line x1="50" y1="32" x2="57" y2="32" />
                <line x1="14.3" y1="14.3" x2="19.3" y2="19.3" />
                <line x1="44.7" y1="44.7" x2="49.7" y2="49.7" />
                <line x1="49.7" y1="14.3" x2="44.7" y2="19.3" />
                <line x1="19.3" y1="44.7" x2="14.3" y2="49.7" />
              </g>
              <circle
                cx="32"
                cy="32"
                r="14"
                fill="#0b4f8c"
                stroke="#f2c96b"
                strokeWidth="2.5"
              />
              <path
                d="M23 28.5C25.5 27 29 27 32 29.2C35 27 38.5 27 41 28.5V37.5C38.5 36 35 36 32 38C29 36 25.5 36 23 37.5V28.5Z"
                fill="#ffffff"
              />
              <line
                x1="32"
                y1="29.2"
                x2="32"
                y2="38"
                stroke="#0b4f8c"
                strokeWidth="1.6"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Khazanah Majelis Tarjih
              </span>
              <span className="hidden rounded-full bg-[#e8f2fc] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0b4f8c] sm:inline-block">
                Full Online
              </span>
            </div>
            <p className="truncate text-xs text-slate-500">
              Putusan Munas, HPT &amp; Fatwa Muhammadiyah
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1.5 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/masalah")
                : pathname.startsWith(item.href) ||
                  (item.href === "/pustaka-pdf" && pathname.startsWith("/pdf"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#0b4f8c] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Menu navigasi"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/" || pathname.startsWith("/masalah")
                  : pathname.startsWith(item.href) ||
                    (item.href === "/pustaka-pdf" &&
                      pathname.startsWith("/pdf"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active
                      ? "bg-[#0b4f8c] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
