import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "../components/AppShell";
import { useStore, approveTxn, rejectTxn, syncPendingRechargesFromBackend } from "../services/store";
import { apiGetRechargeStatus } from "../services/api";
import { useCountdown } from "../hooks/useCountdown";
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const FORTY_FIVE_MIN = 45 * 60 * 1000;

export function PendingPage() {
  const pending = useStore((s) => s.pending);
  const txns = useStore((s) => s.txns);
  const role = useStore((s) => s.user?.role);
  const isStaff = role === "operator" || role === "admin";
  const navigate = useNavigate();
  const cd = useCountdown(pending?.startedAt ?? 0, FORTY_FIVE_MIN);

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      await syncPendingRechargesFromBackend();

      if (pending?.txnId) {
        try {
          const res = await apiGetRechargeStatus(pending.txnId);
          if (res.success && res.data?.status && active) {
            const st = String(res.data.status).toLowerCase();
            if (st === "approved" || st === "success" || st === "completed") {
              approveTxn(pending.txnId);
            } else if (st === "rejected" || st === "failed") {
              rejectTxn(pending.txnId);
            }
          }
        } catch (e) {}
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pending?.txnId]);

  useEffect(() => {
    if (!pending) {
      const last = txns[0];
      if (last?.status === "success")
        navigate({ to: "/recharge/success", search: { id: last.id } });
      else navigate({ to: "/dashboard" });
    }
  }, [pending, txns, navigate]);

  if (!pending) return null;
  const pct = Math.min(100, Math.max(0, cd.pct * 100));

  function handleReject() {
    if (pending) {
      rejectTxn(pending.txnId);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-8 sm:p-10 text-center shadow-sm">
          {/* Animated Spinner Icon */}
          <div className="relative mx-auto grid h-20 w-20 place-items-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2563EB]"
              style={{ animation: "ring-spin 1.2s linear infinite" }}
            />
            <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
          </div>

          {/* Status Badge (Yellow) */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-300 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-800">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            Waiting for Operator Approval
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-[#0F172A]">Recharge Pending</h1>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm font-semibold text-[#64748B]">
            Your payment was received. Your local cable TV operator is verifying & activating your STB pack.
          </p>

          {/* Timer Section (Highlighted) */}
          <div className="mx-auto mt-6 max-w-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Auto-Approves In
            </div>
            <div className="mt-1 text-4xl sm:text-5xl font-extrabold tabular-nums text-[#2563EB]">
              {cd.label}
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-[#2563EB] transition-[width] duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="mx-auto mt-6 grid max-w-md gap-2.5 text-left">
            <Row k="Transaction ID" v={pending.txnId} />
            <Row k="Selected Plan" v={pending.planName} />
            <Row k="Amount Paid" v={`₹${pending.amount}`} />
          </div>

          {/* Operator controls */}
          {isStaff ? (
            <div className="mt-8 pt-6 border-t border-[#CBD5E1]">
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => approveTxn(pending.txnId)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] px-5 py-3 text-sm font-bold text-white shadow-md shadow-green-500/20 transition"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve Recharge
                </button>
                <button
                  onClick={handleReject}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-red-500/20 transition"
                >
                  <XCircle className="h-4 w-4" /> Reject Recharge
                </button>
              </div>
              <p className="mt-3 text-xs font-semibold text-[#64748B]">
                Staff portal action — approving will instantly complete the recharge.
              </p>
            </div>
          ) : (
            <p className="mt-6 text-xs text-[#64748B]">
              This page automatically redirects the moment operator confirms your recharge.
            </p>
          )}
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

export default PendingPage;
