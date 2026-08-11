import { Link } from "@tanstack/react-router";
import {
  Tv,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Phone,
  MessageCircle,
  Wrench,
  Package,
  CreditCard,
  Lock,
  RefreshCw,
  Award,
  Users,
  ChevronRight,
} from "lucide-react";

export function LandingPage() {
  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-sans antialiased overflow-x-hidden scroll-smooth">
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[#CBD5E1] bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563EB] text-white shadow-md shadow-blue-500/20 font-bold">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
                STB RECHARGE
              </span>
              <span className="text-[10px] text-[#64748B] block font-semibold -mt-0.5">
                Operator Controlled System
              </span>
            </div>
          </Link>

          {/* Nav Links - Single Touch Smooth Scroll with Highlight Styling */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={scrollToSection("features")}
              className="rounded-xl px-4 py-2 text-xs font-display font-extrabold uppercase tracking-wider text-[#334155] hover:text-[#2563EB] hover:bg-blue-50 border border-slate-200/60 hover:border-blue-300 transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95"
            >
              Features
            </button>
            <button
              onClick={scrollToSection("how-it-works")}
              className="rounded-xl px-4 py-2 text-xs font-display font-extrabold uppercase tracking-wider text-[#334155] hover:text-[#2563EB] hover:bg-blue-50 border border-slate-200/60 hover:border-blue-300 transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95"
            >
              How It Works
            </button>
            <button
              onClick={scrollToSection("support")}
              className="rounded-xl px-4 py-2 text-xs font-display font-extrabold uppercase tracking-wider text-[#334155] hover:text-[#2563EB] hover:bg-blue-50 border border-slate-200/60 hover:border-blue-300 transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95"
            >
              Support
            </button>
          </nav>

          {/* Header Action */}
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>


      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-[#2563EB]">
                <span>Operator-Controlled Cable TV Recharge</span>
              </div>

              <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-6xl leading-[1.1]">
                Smart Recharge with{" "}
                <span className="text-[#2563EB]">
                  Operator Control
                </span>
              </h1>

              <p className="mx-auto lg:mx-0 max-w-2xl text-base sm:text-lg text-[#64748B] font-medium leading-relaxed">
                Recharge your Set Top Box easily with secure operator approval and real-time status updates.
                Enjoy guaranteed verification and instant channel activation.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-8 py-4 text-base font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  <Zap className="h-5 w-5 fill-current" /> Recharge Now
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#CBD5E1] bg-white px-8 py-4 text-base font-bold text-[#0F172A] shadow-sm hover:bg-slate-50 transition-all"
                >
                  <Clock className="h-5 w-5 text-[#2563EB]" /> Track Recharge
                </Link>
              </div>

              {/* Quick Metrics Badge */}
              <div className="pt-6 border-t border-[#CBD5E1] grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <div className="font-display text-2xl font-extrabold text-[#0F172A]">100%</div>
                  <div className="text-xs text-[#64748B] font-semibold">Operator Verified</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-extrabold text-[#2563EB]">
                    45 Min
                  </div>
                  <div className="text-xs text-[#64748B] font-semibold">Max Approval Time</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-extrabold text-[#22C55E]">24/7</div>
                  <div className="text-xs text-[#64748B] font-semibold">Customer Support</div>
                </div>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200">
                        <Tv className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#0F172A] text-sm">STB-833100124D63</div>
                        <div className="text-[11px] font-bold text-[#64748B] uppercase">KATHIRAVAN V</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#F8FAFC] p-4 border border-[#CBD5E1] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#64748B] uppercase font-bold text-[10px]">
                        Selected Pack
                      </span>
                      <span className="font-mono text-[#2563EB] font-bold">₹240 / Mo</span>
                    </div>
                    <div className="font-bold text-base text-[#0F172A]">
                      BASIC TAMIL PACK HD
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#2563EB] font-bold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-[#2563EB]" /> Operator Verification
                      </span>
                      <span className="font-mono">Live Sync</span>
                    </div>
                    <p className="text-xs text-[#0F172A] font-semibold">
                      Assigned to Local Cable Operator (KATHIRAVAN V)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="relative py-16 bg-[#F8FAFC] border-b border-[#CBD5E1]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Built for Convenience
            </span>
            <h2 className="font-display text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
              A Few Reasons Customers Love STB Recharge
            </h2>
            <p className="text-sm text-[#64748B] font-semibold">
              Simple, secure, and fast recharge experience from start to finish.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Fast Activation",
                desc: "Quick recharge requests with live operator status updates so you stay informed at every step.",
              },
              {
                icon: Shield,
                title: "Secure Verification",
                desc: "Every request is verified by the operator system to make sure your recharge is trusted and protected.",
              },
              {
                icon: Clock,
                title: "Real-Time Tracking",
                desc: "Track your recharge progress anytime and know exactly when your STB gets activated.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm hover:border-[#2563EB] transition"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg text-[#0F172A] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#64748B] font-medium leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative py-16 bg-white border-y border-[#CBD5E1] scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Workflow Guide
            </span>
            <h2 className="font-display text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
              How the Operator System Works
            </h2>
            <p className="text-sm text-[#64748B] font-semibold">
              6 transparent steps from initial login to final STB pack activation.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                step: "01",
                icon: Lock,
                title: "Login with Mobile",
                desc: "Enter your 10-digit mobile number and receive instant OTP. Passwordless & secure.",
              },
              {
                step: "02",
                icon: Tv,
                title: "Enter STB ID",
                desc: "Type your 12-digit Set Top Box ID to view your active subscription.",
              },
              {
                step: "03",
                icon: CreditCard,
                title: "Select Plan & Pay",
                desc: "Choose from monthly packs or channel bouquets and complete checkout.",
              },
              {
                step: "04",
                icon: Clock,
                title: "Request Sent",
                desc: "Your payment enters operator queue with live approval countdown timer.",
              },
              {
                step: "05",
                icon: Shield,
                title: "Operator Approves",
                desc: "Whitelisted local cable operator approves payment & signals activation.",
              },
              {
                step: "06",
                icon: CheckCircle2,
                title: "STB Activated",
                desc: "Your STB channels are activated immediately with SMS & receipt confirmation.",
              },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#F8FAFC] rounded-2xl border border-[#CBD5E1] p-6 shadow-sm hover:border-[#2563EB] transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center font-bold">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-2xl font-extrabold text-[#CBD5E1]">
                      {s.step}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-[#0F172A] mb-1">{s.title}</h3>
                  <p className="text-xs text-[#64748B] font-medium leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SUPPORT / ADMIN SECTION */}
      <section id="support" className="relative py-16 bg-[#F8FAFC] border-b border-[#CBD5E1]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl border border-[#CBD5E1] bg-white p-8 shadow-sm md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-3.5">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold uppercase tracking-wider text-[#0F172A]">
                  👑 ADMIN
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <h3 className="font-display text-2xl sm:text-3xl font-black tracking-widest text-[#0F172A] uppercase border-l-4 border-[#2563EB] pl-3.5 py-0.5">
                    KATHIRAVAN V
                  </h3>
                  <span className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-extrabold text-[#2563EB] tracking-wide">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#475569] font-medium leading-relaxed pt-1">
                  Master Administrator & System Operations Lead. Overseeing instant STB pack activations, operator approvals, signal management, and priority support.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:justify-self-end w-full max-w-xs">
                {/* CALL LINK */}
                <a
                  href="tel:9080864542"
                  className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 transition-all duration-200 hover:bg-blue-100 hover:shadow-sm cursor-pointer group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-sm group-hover:scale-105 transition-transform">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Click to Call</p>
                    <p className="text-sm font-bold text-[#0F172A]">Call: 9080864542</p>
                  </div>
                </a>

                {/* WHATSAPP LINK */}
                <a
                  href="https://wa.me/919080864542"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 transition-all duration-200 hover:bg-emerald-100 hover:shadow-md cursor-pointer group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg className="h-5 w-5 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.705 1.754zm6.097-4.471l.375.222c1.472.873 3.156 1.335 4.877 1.336 5.158 0 9.356-4.198 9.358-9.356.001-2.5-1.026-4.848-2.791-6.613-1.765-1.765-4.114-2.792-6.613-2.793-5.157 0-9.355 4.198-9.357 9.356-.001 1.777.472 3.511 1.37 5.048l.243.413-1.01 3.687 3.774-.99zm11.385-6.84c-.088-.147-.324-.235-.677-.412s-2.091-1.03-2.414-1.148c-.323-.118-.559-.177-.795.176-.236.353-.912 1.148-1.118 1.384-.206.235-.412.265-.765.088s-1.493-.55-2.844-1.754c-1.052-.938-1.763-2.097-1.97-2.45-.206-.353-.022-.544.154-.72.159-.159.353-.412.53-.618.176-.206.235-.353.353-.588.118-.235.059-.441-.03-.618s-.795-1.913-1.089-2.619c-.286-.688-.577-.595-.795-.606-.206-.01-.442-.01-.677-.01s-.618.088-.942.441c-.324.353-1.236 1.207-1.236 2.943s1.265 3.413 1.442 3.649c.176.236 2.489 3.799 6.03 5.328 3.541 1.53 3.541 1.019 4.188.957.647-.06 2.09-.854 2.384-1.677.294-.824.294-1.53.206-1.677z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Click for WhatsApp</p>
                    <p className="text-sm font-bold text-[#0F172A]">WhatsApp: 9080864542</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#CBD5E1] bg-white py-10 text-[#64748B] text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold">
              <Tv className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-base text-[#0F172A]">STB RECHARGE</span>
              <p className="text-[11px] text-[#64748B]">Smart Recharge with Operator Control</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-[#0F172A] font-display font-extrabold text-xs">
            <Link to="/login" search={{ role: "customer" }} className="hover:text-[#2563EB] transition flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#2563EB]" /> Customer Login
            </Link>
            <Link to="/login" search={{ role: "operator" }} className="hover:text-[#2563EB] transition flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600" /> Operator Login
            </Link>
          </div>

          <div className="text-center md:text-right text-[11px] font-semibold text-[#64748B]">
            © {new Date().getFullYear()} STB RECHARGE. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
