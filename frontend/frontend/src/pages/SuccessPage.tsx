import { Link } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";
import { useStore } from "../services/store";
import { CheckCircle2, XCircle, Home, Receipt } from "lucide-react";

export function SuccessPage({ searchId }: { searchId?: string }) {
  const txn = useStore((s) => s.txns.find((t) => t.id === searchId) ?? s.txns[0]);
  const stb = useStore((s) => s.stb);

  if (!txn)
    return (
      <AppShell>
        <div className="mx-auto max-w-md bg-white rounded-2xl border border-[#CBD5E1] p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#64748B]">No recent transaction found.</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm"
          >
            <Home className="h-4 w-4" /> Return to Dashboard
          </Link>
        </div>
      </AppShell>
    );

  const isFailed = txn.status === "failed";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-8 sm:p-10 text-center shadow-sm">
          {isFailed ? (
            /* Red Icon & Failed Status */
            <>
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-red-100 border border-red-300 shadow-sm">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-[#0F172A]">Recharge Failed</h1>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-[#64748B]">
                Your transaction could not be processed by the operator.
              </p>
            </>
          ) : (
            /* Green Tick Icon & Success Status */
            <>
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 border border-emerald-300 shadow-sm">
                <CheckCircle2 className="h-10 w-10 text-[#22C55E]" />
              </div>
              <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-[#0F172A]">Recharge Successful 🎉</h1>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-[#22C55E]">
                Your Set Top Box plan has been activated by your operator.
              </p>
            </>
          )}

          <div className="mx-auto mt-6 grid max-w-md gap-2.5 text-left">
            <Row k="Plan Name" v={txn.planName} />
            <Row k="Amount Paid" v={`₹${txn.amount}`} />
            <Row k="Transaction ID" v={txn.id} />
            <Row k="Date & Time" v={new Date(txn.approvedAt ?? txn.date).toLocaleString()} />
            {stb && <Row k="STB ID" v={stb.id} />}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition"
            >
              <Home className="h-4 w-4" /> Go to Dashboard
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] px-5 py-3 text-xs sm:text-sm font-bold text-[#0F172A] hover:bg-slate-100 transition"
            >
              <Receipt className="h-4 w-4" /> View History
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-xs font-bold">
      <span className="text-[#64748B]">{k}</span>
      <span className="text-[#0F172A] font-mono">{v}</span>
    </div>
  );
}

export default SuccessPage;
