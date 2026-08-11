import { AppShell } from "../components/AppShell";
import { Gift, Copy } from "lucide-react";

const OFFERS = [
  {
    code: "STB50",
    title: "Flat ₹50 Off",
    desc: "Valid on recharges above ₹240",
    tag: "BEST OFFER",
  },
  {
    code: "NEW10",
    title: "₹10 Welcome Bonus",
    desc: "Valid on your first STB recharge",
    tag: "NEW USER",
  },
  {
    code: "WELCOME",
    title: "Flat ₹25 Off",
    desc: "Valid on 2 month plans above ₹200",
    tag: "TRENDING",
  },
];

export function OffersPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">Offers & Discounts</h1>
        <p className="text-sm font-semibold text-[#64748B] mt-1">Apply promo coupons at checkout to save on recharges.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {OFFERS.map((o) => (
          <div key={o.code} className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm flex flex-col justify-between hover:border-[#2563EB] transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {o.tag}
                </span>
                <span className="text-xs font-mono font-bold text-[#64748B] flex items-center gap-1">
                  <Gift className="h-3.5 w-3.5 text-[#2563EB]" /> Code: {o.code}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-bold text-[#0F172A]">{o.title}</h2>
              <p className="mt-1 text-xs text-[#64748B] font-medium">{o.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#CBD5E1] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#2563EB] bg-slate-100 px-3 py-1 rounded-lg border border-[#CBD5E1]">
                {o.code}
              </span>
              <span className="text-xs font-bold text-[#2563EB]">Use at Checkout</span>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export default OffersPage;
