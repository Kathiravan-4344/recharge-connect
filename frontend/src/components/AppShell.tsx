import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home,
  CreditCard,
  Gift,
  Receipt,
  LogOut,
  Tv,
  MessageCircle,
  Shield,
  Package,
  Wrench,
} from "lucide-react";
import { useStore, logout } from "@/lib/store";
import { useState, type ReactNode } from "react";
import { ChatWidget } from "./ChatWidget";

const nav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/plans", label: "Plans", icon: CreditCard },
  { to: "/products", label: "Accessories", icon: Package },
  { to: "/complaints", label: "Complaints", icon: Wrench },
  { to: "/offers", label: "Offers", icon: Gift },
  { to: "/history", label: "History", icon: Receipt },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin") || user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#CBD5E1] shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563EB] text-white font-bold shadow-md shadow-blue-500/20">
              <Tv className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-bold tracking-tight flex items-center gap-2 text-[#0F172A]">
                STB RECHARGE
                {isAdminRoute && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#2563EB] border border-blue-200 uppercase tracking-wider">
                    ADMIN PORTAL
                  </span>
                )}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#64748B] font-medium">
                {isAdminRoute
                  ? "Master Control • KATHIRAVAN V"
                  : "Smart Recharge · Operator Control"}
              </div>
            </div>
          </div>

          {!isAdminRoute ? (
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((n) => {
                const active = pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                      active
                        ? "bg-[#2563EB] text-white shadow-sm shadow-blue-500/20"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
              {user?.role === "operator" && (
                <Link
                  to="/operator"
                  className={`flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] px-3.5 py-2 text-xs font-bold transition ${
                    pathname.startsWith("/operator")
                      ? "bg-[#2563EB] text-white border-[#2563EB]"
                      : "bg-[#E2E8F0] text-[#0F172A] hover:bg-[#2563EB] hover:text-white"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" /> Operator Panel
                </Link>
              )}
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-[#2563EB]">
                👑 Super Admin: KATHIRAVAN V (9080864542)
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {user && !isAdminRoute && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#64748B]">
                {user.role === "operator" && (
                  <Shield className="h-3 w-3 text-[#2563EB]" />
                )}
                +91 {user.mobile}
              </span>
            )}
            <button
              onClick={() => {
                void logout();
                navigate({ to: "/login" });
              }}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-10">{children}</main>

      {/* Bottom nav mobile (For Customers & Operators) */}
      {!isAdminRoute && (
        <nav className="fixed bottom-3 left-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 md:hidden">
          <div className="bg-white/95 border border-[#CBD5E1] shadow-xl p-1.5 rounded-2xl flex items-center justify-around backdrop-blur-xl">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex flex-col items-center rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all ${
                    active
                      ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap mt-0.5">{n.label}</span>
                </Link>
              );
            })}
            {user?.role === "operator" && (
              <Link
                to="/operator"
                className={`flex flex-col items-center rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all ${
                  pathname.startsWith("/operator")
                    ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                    : "text-[#2563EB] bg-blue-50 border border-blue-200"
                }`}
              >
                <Shield className="h-4 w-4" />
                <span className="whitespace-nowrap mt-0.5">Operator</span>
              </Link>
            )}
          </div>
        </nav>
      )}

      {/* Chat FAB (Only for Customers / Operators) */}
      {!isAdminRoute && (
        <>
          <button
            onClick={() => setChatOpen((v) => !v)}
            className="fixed bottom-24 right-4 z-40 grid h-13 w-13 place-items-center rounded-full bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#1D4ED8] hover:scale-105 md:bottom-6"
            aria-label="Live support"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
          <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
        </>
      )}
    </div>
  );
}
