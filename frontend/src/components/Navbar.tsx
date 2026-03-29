"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Watch, Activity, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dealer", label: "Dealer" },
  { href: "/marketplace", label: "Market" },
  { href: "/verify", label: "Verify" },
  { href: "/collection", label: "Collection" },
  { href: "/activity", label: "Activity" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-3xl">
          {/* Main pill */}
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-zinc-700/60 bg-zinc-950/85 backdrop-blur-xl px-3 py-2 shadow-2xl shadow-black/50">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-zinc-950 group-hover:bg-emerald-400 transition-colors duration-200">
                <Watch className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-sm tracking-tight hidden sm:block">
                Lux<span className="text-emerald-400">Verify</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200",
                    pathname === link.href
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop right actions */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-medium tracking-wide">Testnet</span>
              </div>
              <Link
                href="/activity"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                  pathname === "/activity"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                )}
              >
                <Activity className="w-3 h-3" />
                Live Feed
              </Link>
              <Link
                href="/dealer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
              >
                Mint Watch
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {open && (
            <div className="mt-2 rounded-2xl border border-zinc-700/60 bg-zinc-950/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/50 animate-fade-in">
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-2 py-2.5 rounded-xl text-xs font-medium text-center transition-all",
                      pathname === link.href
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Link
                  href="/dealer"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold text-center hover:bg-emerald-400 transition-colors"
                >
                  Mint Watch
                </Link>
                <Link
                  href="/activity"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium text-center hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3 h-3" />
                  Live Feed
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
      {/* Spacer — pushes page content below the fixed navbar */}
      <div className="h-20" />
    </>
  );
}
