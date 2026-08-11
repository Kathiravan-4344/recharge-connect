import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "../components/AppShell";
import { fetchStb, useStore, PLANS, formatName, setState, getState, selectPlan } from "../services/store";
import {
  Tv,
  Zap,
  Gift,
  MessageCircle,
  CreditCard,
  ChevronRight,
  Sparkles,
  Clock,
  Package,
  ShoppingBag,
  ArrowRight,
  Wrench,
  PhoneCall,
  Headphones,
} from "lucide-react";

function getOperatorNameByMobile(mobile?: string) {
  if (!mobile) return "PERUMAL A";
  const clean = mobile.replace(/\D/g, "");
  if (clean === "9080864542") return "KATHIRAVAN V";
  if (clean === "9787312758" || clean === "9787313121") return "PERUMAL A";
  return "PERUMAL A";
}

export function DashboardPage() {
  const user = useStore((s) => s.user);
  const stb = useStore((s) => s.stb);
  const autoRecharge = useStore((s) => s.autoRecharge);
  const pending = useStore((s) => s.pending);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  useEffect(() => {
    if (pending) navigate({ to: "/recharge/pending" });
  }, [pending, navigate]);

  useEffect(() => {
    if (!stb) {
      fetchStb(user?.stbId || "1234567890");
    }
  }, [stb, user]);

  const allPlans = useStore((s) => (s.plans.length ? s.plans : PLANS));
  const recommended = allPlans.filter((p) => p.popular || p.category === "Monthly").slice(0, 3);
  const daysLeft = stb ? Math.ceil((new Date(stb.expiry).getTime() - Date.now()) / 86400000) : 0;

  // Dynamic Operator Helpline Contact Number & Name
  const rawOpNumber =
    user?.operatorMobile ||
    user?.operatorNumber ||
    stb?.operatorMobile ||
    "9787312758";

  const cleanOpNumber = rawOpNumber.replace(/\D/g, "") || "9787312758";
  const formattedOpNumber =
    cleanOpNumber.length === 10
      ? `+91 ${cleanOpNumber.slice(0, 5)} ${cleanOpNumber.slice(5)}`
      : `+91 ${cleanOpNumber}`;

  const opName = user?.operatorName || getOperatorNameByMobile(cleanOpNumber);

  const currentStbId = user?.stbId || stb?.id || "STB-833100124D63";
  const waMsg = encodeURIComponent(
    `Hi ${opName}, I need support regarding my STB Recharge (STB ID: ${currentStbId})`
  );

  return (
    <AppShell title="Customer Dashboard">
      {/* Welcome Banner - Soft Light Modern Gradient */}
      <section className="bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-50 border border-blue-200/80 rounded-3xl p-6 sm:p-8 text-[#0F172A] shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-bold text-[#2563EB] border border-blue-200">
            <Sparkles className="h-3.5 w-3.5 text-[#2563EB] fill-[#2563EB]" />
            <span>Smart Cable TV Control Center</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Welcome back, <span className="text-[#2563EB]">{formatName(user?.name || "Customer")}</span> 👋
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] font-semibold leading-relaxed">
            Manage your STB subscription, request fast recharges with local operator approval, buy accessories & log complaints.
          </p>
        </div>

        {/* Decorative background accent */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-blue-200/30 blur-2xl pointer-events-none" />
      </section>

      {/* Main STB Info Card */}
      <section className="mt-6 bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[#CBD5E1] pb-6">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-200 shadow-sm">
              <Tv className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-extrabold text-[#0F172A]">
                  {stb?.id || user?.stbId || "1234567890"}
                </span>
                <StatusDot active={stb?.active ?? true} />
              </div>
              <p className="text-xs font-semibold text-[#64748B] mt-0.5 uppercase tracking-wide">
                Registered STB Box ID • Owner: {formatName(user?.name || "Customer")}
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                selectPlan(PLANS[0]);
                navigate({ to: "/recharge/checkout" });
              }}
              className="flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Zap className="h-4 w-4 fill-current" /> Quick Recharge Now
            </button>
          </div>
        </div>

        {/* STB Details Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
          <Meta label="Current Subscription Plan" value={stb?.currentPlan || "Basic Tamil Pack Monthly Rs 220"} />
          <Meta
            label="Plan Expiry Date"
            value={
              stb?.expiry
                ? new Date(stb.expiry).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Active"
            }
          />
          <Meta label="Account Status" value={stb?.active ? "Active Box" : "Expired / Disconnected"} accent={stb?.active ? "ok" : "warn"} />
          <Meta label="Assigned Cable Operator" value={`${opName} (${formattedOpNumber})`} />
        </div>
      </section>

      {/* Quick Services Grid */}
      <section className="mt-6">
        <h2 className="text-base font-bold text-[#0F172A] mb-3">Quick Services</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            to="/plans"
            className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm hover:border-[#2563EB] hover:shadow-md transition group"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xl group-hover:bg-[#2563EB] group-hover:text-white transition">
              📺
            </div>
            <div className="mt-3 font-bold text-base text-[#0F172A]">Plans</div>
            <p className="text-xs text-[#64748B] mt-0.5">Explore & pick STB packages</p>
          </Link>

          <Link
            to="/recharge/checkout"
            className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm hover:border-[#2563EB] hover:shadow-md transition group"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xl group-hover:bg-[#2563EB] group-hover:text-white transition">
              💳
            </div>
            <div className="mt-3 font-bold text-base text-[#0F172A]">Recharge</div>
            <p className="text-xs text-[#64748B] mt-0.5">Instant online payment</p>
          </Link>

          <Link
            to="/products"
            className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm hover:border-[#2563EB] hover:shadow-md transition group"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xl group-hover:bg-[#2563EB] group-hover:text-white transition">
              📦
            </div>
            <div className="mt-3 font-bold text-base text-[#0F172A]">Products</div>
            <p className="text-xs text-[#64748B] mt-0.5">Remotes, cables & adapters</p>
          </Link>

          <Link
            to="/complaints"
            className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm hover:border-[#2563EB] hover:shadow-md transition group"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xl group-hover:bg-[#2563EB] group-hover:text-white transition">
              🛠
            </div>
            <div className="mt-3 font-bold text-base text-[#0F172A]">Complaints</div>
            <p className="text-xs text-[#64748B] mt-0.5">Signal & hardware support</p>
          </Link>
        </div>
      </section>

      {/* Emergency Contact & Customer Support Card */}
      <section className="mt-6 bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <PhoneCall className="h-5 w-5 text-[#2563EB]" />
          <h3 className="font-bold text-base text-[#0F172A]">Operator & Helpline Support</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <a
            href={`tel:${cleanOpNumber}`}
            className="flex items-center justify-between rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-3 text-xs font-bold text-[#0F172A] hover:border-[#2563EB] hover:bg-blue-50/50 transition group"
            title={`Call Operator ${opName} (${formattedOpNumber})`}
          >
            <span className="flex items-center gap-1.5">
              <PhoneCall className="h-4 w-4 text-[#2563EB]" /> Call {opName}
            </span>
            <span className="font-mono text-[#2563EB] font-extrabold group-hover:underline">{formattedOpNumber}</span>
          </a>

          <a
            href={`https://wa.me/91${cleanOpNumber}?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl bg-emerald-50/60 border border-emerald-200 p-3 text-xs font-bold text-[#0F172A] hover:border-[#22C55E] hover:bg-emerald-100/50 transition group"
            title={`Chat on WhatsApp with ${opName} (${formattedOpNumber})`}
          >
            <span className="flex items-center gap-1.5 text-emerald-900">
              <MessageCircle className="h-4 w-4 text-[#22C55E] fill-emerald-100" /> WhatsApp Support
            </span>
            <span className="text-[#22C55E] font-extrabold flex items-center gap-1 group-hover:underline">
              {opName} <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
            </span>
          </a>

          <a
            href="tel:18001234567"
            className="flex items-center justify-between rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-3 text-xs font-bold text-[#0F172A] hover:border-[#2563EB] transition"
          >
            <span className="flex items-center gap-1.5">
              <Headphones className="h-4 w-4 text-[#64748B]" /> Customer Care
            </span>
            <span className="font-mono text-[#64748B]">1800-123-4567</span>
          </a>
        </div>
      </section>

      {/* Recommended Plans */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2563EB]" /> Recommended Plans
          </h2>
          <Link to="/plans" className="text-xs font-bold text-[#2563EB] hover:underline">
            View All Plans →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((p) => (
            <PlanMini key={p.id} plan={p} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        active ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-red-100 text-red-800 border border-red-300"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-[#22C55E]" : "bg-red-600"}`} />
      {active ? "Active" : "Inactive"}
    </div>
  );
}

function Meta({ label, value, accent }: { label: string; value: string; accent?: "ok" | "warn" }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase text-[#64748B]">{label}</div>
      <div
        className={`mt-0.5 text-sm font-bold ${
          accent === "warn" ? "text-amber-600" : "text-[#0F172A]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function AutoRechargeToggle() {
  const enabled = useStore((s) => s.autoRecharge.enabled);
  return (
    <button
      onClick={() =>
        setState({ autoRecharge: { ...getState().autoRecharge, enabled: !enabled } })
      }
      className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-[#2563EB]" : "bg-[#CBD5E1]"}`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function PlanMini({ plan }: { plan: (typeof PLANS)[number] }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">
            {plan.category}
          </span>
          {plan.popular && (
            <span className="rounded-full bg-blue-100 text-[#2563EB] px-2.5 py-0.5 text-[10px] font-bold border border-blue-200 uppercase">
              POPULAR
            </span>
          )}
        </div>
        <div className="mt-2 font-bold text-lg text-[#0F172A]">{plan.name}</div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-[#2563EB]">₹{plan.price}</span>
          <span className="text-xs text-[#64748B] font-semibold">/ {plan.validityDays} days</span>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-[#64748B]">
          {plan.features.slice(0, 2).map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <span className="text-[#2563EB] font-bold">•</span> {f}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={() => {
          selectPlan(plan);
          navigate({ to: "/recharge/checkout", search: { plan: plan.id || plan._id || "m3" } });
        }}
        className="mt-4 w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-2.5 text-sm font-bold text-white shadow-sm transition"
      >
        Select Plan
      </button>
    </div>
  );
}

export default DashboardPage;
