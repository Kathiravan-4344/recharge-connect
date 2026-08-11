import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { PLANS, startPayment, useStore, setState } from "../services/store";
import { CreditCard, ShieldCheck, Tv, Tag, ArrowRight } from "lucide-react";

const COUPONS: Record<string, number> = { STB50: 50, NEW10: 10, WELCOME: 25 };

export function CheckoutPage({ searchPlanId }: { searchPlanId?: string }) {
  const allPlans = useStore((s) => (s.plans.length ? s.plans : PLANS));
  const selectedPlanId = useStore((s) => s.selectedPlanId);
  const selectedPlanObject = useStore((s) => s.selectedPlanObject);

  const activePlanId = useMemo(() => {
    // 1. Highest Priority: URL parameter ?plan=m3
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const searchPart = hash.includes("?") ? hash.split("?")[1] : window.location.search;
      const params = new URLSearchParams(searchPart);
      const urlPlan = params.get("plan");
      if (urlPlan) return urlPlan;
    }
    if (searchPlanId) return searchPlanId;
    if (selectedPlanId) return selectedPlanId;
    return undefined;
  }, [searchPlanId, selectedPlanId]);

  const plan = useMemo(() => {
    if (activePlanId) {
      const targetStr = String(activePlanId).toLowerCase().trim();
      const found = allPlans.find((p: any) => {
        const pid = String(p.id || p._id || "").toLowerCase();
        if (pid === targetStr) return true;
        if (targetStr === "m3" || targetStr === "300") return p.price === 300 || p.name.includes("300");
        if (targetStr === "m2" || targetStr === "240") return p.price === 240 || p.name.includes("240");
        if (targetStr === "m1" || targetStr === "220") return p.price === 220 || p.name.includes("220");
        return p.name.toLowerCase().includes(targetStr) || String(p.price) === targetStr;
      });
      if (found) return found;
    }

    if (selectedPlanObject && selectedPlanObject.name && selectedPlanObject.price) {
      return selectedPlanObject;
    }

    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      if (hash.includes("m3") || hash.includes("300")) {
        return allPlans.find((p) => p.price === 300) || PLANS[2];
      }
      if (hash.includes("m2") || hash.includes("240")) {
        return allPlans.find((p) => p.price === 240) || PLANS[1];
      }
      if (hash.includes("m1") || hash.includes("220")) {
        return allPlans.find((p) => p.price === 220) || PLANS[0];
      }
    }

    return allPlans.find((p) => p.price === 300) || PLANS[2] || allPlans[0];
  }, [allPlans, activePlanId, selectedPlanObject]);

  const user = useStore((s) => s.user);
  const stb = useStore((s) => s.stb);
  const appliedCoupon = useStore((s) => s.appliedCoupon);
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState(appliedCoupon ?? "");
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [processing, setProcessing] = useState(false);

  const discount = appliedCoupon ? (COUPONS[appliedCoupon] ?? 0) : 0;
  const total = Math.max(0, plan.price - discount);

  function apply() {
    const code = coupon.trim().toUpperCase();
    if (COUPONS[code]) setState({ appliedCoupon: code });
    else setState({ appliedCoupon: null });
  }

  function pay() {
    if (processing) return;
    setProcessing(true);
    setTimeout(() => {
      startPayment(plan.id || plan.name, total, plan.name, {
        stbId: stb?.id || user?.stbId,
        customerName: user?.name || stb?.customerName,
        customerMobile: user?.mobile,
      });
      navigate({ to: "/recharge/pending" });
    }, 1000);
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">Payment & Recharge</h1>
        <p className="text-sm font-semibold text-[#64748B] mt-1">
          Review your selected plan and confirm payment.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* STB Summary Card */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                  <Tv className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-[#64748B]">
                    Recharge For STB ID
                  </div>
                  <div className="text-base font-bold text-[#0F172A] mt-0.5">
                    {stb?.customerName ?? "Customer"} · <span className="font-mono">{stb?.id ?? "123456789012"}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="text-xs font-bold text-[#2563EB] hover:underline"
              >
                Change STB
              </button>
            </div>
          </div>

          {/* Payment Method Cards */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
              <CreditCard className="h-4 w-4 text-[#2563EB]" /> Select Payment Method
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(["upi", "card", "netbanking"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    method === m
                      ? "border-[#2563EB] bg-blue-50/70 shadow-sm"
                      : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-slate-400"
                  }`}
                >
                  <div className={`font-bold text-sm uppercase ${method === m ? "text-[#2563EB]" : "text-[#0F172A]"}`}>
                    {m === "upi" ? "UPI" : m === "card" ? "Card" : "Net Banking"}
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    {m === "upi"
                      ? "GPay, PhonePe, Paytm"
                      : m === "card"
                        ? "Credit / Debit Card"
                        : "All Major Banks"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
              <Tag className="h-4 w-4 text-[#2563EB]" /> Apply Promo Coupon
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Enter coupon (e.g. STB50, NEW10)"
                className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB]"
              />
              <button
                onClick={apply}
                className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-3 text-sm font-bold text-white shadow-sm"
              >
                Apply
              </button>
            </div>
            {appliedCoupon && discount > 0 && (
              <p className="mt-2 text-xs font-bold text-[#22C55E]">
                ✅ Coupon "{appliedCoupon}" applied! Saved ₹{discount}.
              </p>
            )}
          </div>
        </div>

        {/* Selected Plan Summary Card */}
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm h-fit">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Selected Plan Summary
          </div>
          <div className="mt-2 text-xl font-bold text-[#0F172A]">{plan.name}</div>
          <div className="mt-4 space-y-2.5 text-sm">
            <Row label="Base Price" value={`₹${plan.price}`} />
            <Row label="Validity Period" value={`${plan.validityDays} Days`} />
            {discount > 0 && (
              <Row label={`Discount (${appliedCoupon})`} value={`- ₹${discount}`} accent />
            )}
            <div className="my-3 border-t border-[#CBD5E1]" />
            <Row label="Total Amount" value={`₹${total}`} big />
          </div>

          {/* Big Button */}
          <button
            onClick={pay}
            disabled={processing}
            className="mt-6 w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-4 px-4 text-base font-extrabold text-white shadow-md shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              "Processing Payment…"
            ) : (
              <>
                Pay & Request Recharge <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
            <ShieldCheck className="h-4 w-4 text-[#22C55E]" /> 100% Encrypted & Operator Protected
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({
  label,
  value,
  accent,
  big,
}: {
  label: string;
  value: string;
  accent?: boolean;
  big?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-[#64748B]">{label}</span>
      <span
        className={`${
          big ? "text-2xl font-extrabold text-[#2563EB]" : "text-sm font-bold text-[#0F172A]"
        } ${accent ? "text-[#22C55E]" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export default CheckoutPage;
