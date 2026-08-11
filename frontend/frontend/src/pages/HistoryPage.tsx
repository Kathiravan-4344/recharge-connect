import { AppShell } from "../components/AppShell";
import { useStore } from "../services/store";
import { Receipt } from "lucide-react";

export function HistoryPage() {
  const txns = useStore((s) => s.txns);
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">Transaction History</h1>
        <p className="text-sm font-semibold text-[#64748B] mt-1">All your STB recharge transactions.</p>
      </div>
      {txns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-10 text-center shadow-sm">
          <Receipt className="mx-auto h-10 w-10 text-[#64748B]" />
          <p className="mt-3 text-sm font-semibold text-[#64748B]">
            No transactions yet. Recharge a plan to see it here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
          <table className="w-full text-sm text-[#0F172A]">
            <thead className="border-b border-[#CBD5E1] bg-[#F8FAFC] text-left text-xs uppercase tracking-wider text-[#64748B] font-bold">
              <tr>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3 hidden sm:table-cell">Date</th>
                <th className="px-5 py-3 hidden md:table-cell">Txn ID</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD5E1]">
              {txns.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4 font-bold text-[#0F172A]">{t.planName}</td>
                  <td className="px-5 py-4 font-mono font-bold text-[#2563EB]">₹{t.amount}</td>
                  <td className="px-5 py-4 text-[#64748B] font-medium hidden sm:table-cell">
                    {new Date(t.date).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 font-mono text-[#64748B] hidden md:table-cell">{t.id}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function StatusBadge({ status }: { status: "pending" | "success" | "failed" }) {
  const map = {
    pending: {
      c: "bg-amber-100 text-amber-800 border-amber-300",
      t: "Pending",
    },
    success: {
      c: "bg-emerald-100 text-emerald-800 border-emerald-300",
      t: "Success",
    },
    failed: { c: "bg-red-100 text-red-800 border-red-300", t: "Failed" },
  }[status];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${map.c}`}>
      {map.t}
    </span>
  );
}

export default HistoryPage;
