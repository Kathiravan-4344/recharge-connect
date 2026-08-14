import { useEffect } from "react";
import { AppShell } from "../components/AppShell";
import { useStore, syncPendingRechargesFromBackend, formatName } from "../services/store";
import { Receipt, Calendar, CreditCard, Tv, CheckCircle2, Clock, XCircle } from "lucide-react";

export function HistoryPage() {
  const user = useStore((s) => s.user);
  const stb = useStore((s) => s.stb);
  const allTxns = useStore((s) => s.txns);

  useEffect(() => {
    syncPendingRechargesFromBackend();
  }, []);

  // Filter transactions for current logged-in customer
  const currentStb = (stb?.id || user?.stbId || "").trim().toUpperCase();
  const currentMobile = (user?.mobile || "").replace(/\D/g, "");

  const userTxns = allTxns.filter((t) => {
    if (!currentStb && !currentMobile) return true;
    const tStb = (t.stbId || "").trim().toUpperCase();
    const tMobile = (t.customerMobile || "").replace(/\D/g, "");

    const matchStb = currentStb && tStb && (tStb === currentStb || tStb.includes(currentStb) || currentStb.includes(tStb));
    const matchMobile = currentMobile && tMobile && currentMobile.slice(-10) === tMobile.slice(-10);

    return matchStb || matchMobile;
  });

  const txns = userTxns.length > 0 ? userTxns : allTxns;

  const totalSpent = txns
    .filter((t) => t.status === "success")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <AppShell>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">📜 Recharge History</h1>
          <p className="text-sm font-semibold text-[#64748B] mt-1">
            View all your past STB pack recharges and payment receipts.
          </p>
        </div>

        {/* Customer Quick Stats Badge */}
        <div className="flex items-center gap-3 bg-white border border-[#CBD5E1] rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B]">
            <Tv className="h-4 w-4 text-[#2563EB]" />
            <span>STB: <strong className="text-[#0F172A] font-mono">{currentStb || "N/A"}</strong></span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="text-xs font-bold text-[#64748B]">
            Total Recharges: <strong className="text-[#2563EB] font-extrabold">{txns.length}</strong>
          </div>
        </div>
      </div>

      {txns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-12 text-center shadow-sm">
          <Receipt className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-[#0F172A]">No Recharge History Yet</h3>
          <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto">
            Once your local cable operator approves your recharge requests, your complete payment history will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">
              All Completed & Pending Payments ({txns.length})
            </h2>
            <span className="text-xs font-bold text-[#64748B]">
              Total Paid: <strong className="text-[#2563EB]">₹{totalSpent}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#0F172A]">
              <thead className="border-b border-[#CBD5E1] bg-[#F1F5F9] text-left text-xs uppercase tracking-wider text-[#64748B] font-bold">
                <tr>
                  <th className="px-6 py-3.5">Plan Name</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5 hidden md:table-cell">STB ID</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]">
                {txns.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-[#0F172A]">
                      <div>{t.planName}</div>
                      <div className="text-[11px] font-mono font-normal text-[#64748B] md:hidden mt-0.5">
                        STB: {t.stbId || currentStb}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-extrabold text-[#2563EB] text-base">
                      ₹{t.amount}
                    </td>
                    <td className="px-6 py-4 text-[#64748B] font-semibold text-xs whitespace-nowrap">
                      {new Date(t.date).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-mono text-[#64748B] font-bold text-xs hidden md:table-cell">
                      {t.stbId || currentStb}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatusBadge({ status }: { status: "pending" | "success" | "failed" }) {
  switch (status) {
    case "success":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" /> Approved & Paid
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" /> Pending Approval
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
          <XCircle className="h-3.5 w-3.5 text-red-600" /> Rejected / Failed
        </span>
      );
  }
}

export default HistoryPage;
