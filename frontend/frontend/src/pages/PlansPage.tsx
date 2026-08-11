import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { PLANS, useStore, selectPlan } from "../services/store";
import { Check, Star } from "lucide-react";

const TABS = ["All", "Monthly", "Channels", "Add-on"] as const;

export function PlansPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const navigate = useNavigate();
  const allPlans = useStore((s) => (s.plans.length ? s.plans : PLANS));
  const list = allPlans.filter((p) => tab === "All" || p.category === tab);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">Choose a Plan</h1>
        <p className="text-sm font-semibold text-[#64748B] mt-1">
          Select your Set Top Box pack for instant operator recharge.
        </p>
      </div>

      {/* Category Tabs using Global Tab Fix */}
      <div className="mb-6 inline-flex max-w-full overflow-x-auto no-scrollbar rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] p-1.5 gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex shrink-0 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out whitespace-nowrap ${
              tab === t
                ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Plan Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm flex flex-col justify-between relative hover:border-[#2563EB] hover:shadow-md transition"
          >
            {p.popular && (
              <div className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-[#2563EB] text-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                <Star className="h-3 w-3 fill-current" /> Most Popular
              </div>
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-slate-100 px-2.5 py-1 rounded-md inline-block">
                {p.category}
              </div>
              <h2 className="mt-3 text-xl font-bold text-[#0F172A]">{p.name}</h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[#2563EB]">₹{p.price}</span>
                <span className="text-sm font-semibold text-[#64748B]">/ {p.validityDays} days</span>
              </div>
              {p.channels && (
                <div className="mt-1 text-xs font-semibold text-[#2563EB]">
                  {p.channels} channels included
                </div>
              )}
              <ul className="mt-4 space-y-2 text-xs text-[#64748B]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-[#22C55E] shrink-0" />
                    <span className="text-[#0F172A] font-medium">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => {
                selectPlan(p);
                navigate({ to: "/recharge/checkout", search: { plan: p.id || p._id || "m3" } });
              }}
              className="mt-6 w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-[0.99]"
            >
              Select Plan
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export default PlansPage;
