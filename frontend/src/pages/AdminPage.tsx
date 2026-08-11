import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  useStore,
  upsertOperator,
  setOperatorActive,
  removeApprovedOperator,
  refreshAdminData,
  blockCustomer,
  unblockCustomer,
  approveTxn,
  updateProductStatus,
  updateComplaintStatus,
  upsertProduct,
  removeProduct,
  resetAllData,
  formatName,
  type Product,
  type ApprovedOperator,
  type ComplaintStatus,
} from "../services/store";
import {
  Shield,
  Users,
  CreditCard,
  Wrench,
  Package,
  Trash2,
  UserCheck,
  UserX,
  Search,
  Plus,
  Lock,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Edit,
  Eye,
  Tv,
  Phone,
  Clock,
  Filter,
  Check,
  X,
} from "lucide-react";

type TabType =
  | "dashboard"
  | "operators"
  | "customers"
  | "recharges"
  | "complaints"
  | "product_requests";

function getOperatorForRecord(
  rec: { customerMobile?: string; stbId?: string; operatorMobile?: string },
  operators: ApprovedOperator[]
): ApprovedOperator | null {
  if (!operators || operators.length === 0) return null;
  if (rec.operatorMobile) {
    const found = operators.find((op) => op.mobile === rec.operatorMobile);
    if (found) return found;
  }
  const key = (rec.customerMobile || rec.stbId || "").trim();
  if (!key) return operators[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
  }
  const index = Math.abs(hash) % operators.length;
  return operators[index] || operators[0];
}

export function AdminPage() {
  const user = useStore((s) => s.user);
  const txns = useStore((s) => s.txns);
  const products = useStore((s) => s.products);
  const productRequests = useStore((s) => s.productRequests);
  const complaints = useStore((s) => s.complaints);
  const approvedOperators = useStore((s) => s.approvedOperators);
  const blockedCustomers = useStore((s) => s.blockedCustomers);

  const [tab, setTab] = useState<TabType>("dashboard");
  const [opMobile, setOpMobile] = useState("");
  const [opName, setOpName] = useState("");
  const [opStbBox, setOpStbBox] = useState<"SCV" | "TCCL" | "AKSHAYA DIGINET" | "TACTV">("SCV");
  const [opPortalLink, setOpPortalLink] = useState("");
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Search states per tab
  const [customerSearch, setCustomerSearch] = useState("");
  const [rechargeSearch, setRechargeSearch] = useState("");
  const [rechargeStatusFilter, setRechargeStatusFilter] = useState<string>("all");
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>("all");
  const [productSearch, setProductSearch] = useState("");

  // Selected Operator Modal State
  const [selectedOperator, setSelectedOperator] = useState<ApprovedOperator | null>(null);
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>("all");
  const [opModalTab, setOpModalTab] = useState<"customers" | "recharges" | "complaints" | "products">("customers");

  const navigate = useNavigate();

  // STRICT ADMIN GUARD
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate({ to: "/" });
    } else {
      refreshAdminData();
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  // Handlers
  async function handleAddOperator(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!opMobile.trim() || !opName.trim()) return;
    const res = await upsertOperator(opMobile.trim(), opName.trim(), opStbBox, opPortalLink.trim());
    if (res.success) {
      setMsg({ text: `Operator ${opName} (${opStbBox}) added successfully!` });
    } else {
      setMsg({ text: res.message || `Failed to save operator to database.`, error: true });
    }
    setOpMobile("");
    setOpName("");
    setOpPortalLink("");
    setOpStbBox("SCV");
  }

  // Derived Metrics
  const totalRechargeAmount = txns
    .filter((t) => t.status && ["success", "approved"].includes(String(t.status).toLowerCase()))
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingRechargesCount = txns.filter(
    (t) => t.status && String(t.status).toLowerCase() === "pending",
  ).length;
  const pendingComplaintsCount = complaints.filter(
    (c) => c.status && String(c.status).toLowerCase() === "pending",
  ).length;

  // Aggregate Customer list from all records
  const customerMap = new Map<string, { mobile: string; name: string; stbId: string }>();
  txns.forEach((t) => {
    const key = t.customerMobile || t.stbId || "Unknown";
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        mobile: t.customerMobile || "N/A",
        name: t.customerName || "Customer",
        stbId: t.stbId || "1234567890",
      });
    }
  });
  productRequests.forEach((pr) => {
    const key = pr.customerMobile || pr.stbId;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        mobile: pr.customerMobile,
        name: pr.customerName,
        stbId: pr.stbId,
      });
    }
  });
  complaints.forEach((cmp) => {
    const key = cmp.customerMobile || cmp.stbId;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        mobile: cmp.customerMobile,
        name: cmp.customerName,
        stbId: cmp.stbId,
      });
    }
  });

  const allCustomers = Array.from(customerMap.values());
  const filteredCustomers = allCustomers.filter((c) => {
    const matchSearch =
      c.mobile.includes(customerSearch) ||
      c.stbId.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase());
    const op = getOperatorForRecord(c, approvedOperators);
    const matchOp =
      selectedOperatorFilter === "all" ||
      (op && (op.id === selectedOperatorFilter || op.mobile === selectedOperatorFilter));
    return matchSearch && matchOp;
  });

  const validStatuses = ["pending", "success", "approved", "failed", "rejected"];
  const filteredTxns = txns.filter((t) => {
    if (!t) return false;
    const normStatus = t.status ? String(t.status).toLowerCase() : "";
    const matchSearch =
      t.id.toLowerCase().includes(rechargeSearch.toLowerCase()) ||
      (t.customerName && t.customerName.toLowerCase().includes(rechargeSearch.toLowerCase())) ||
      (t.stbId && t.stbId.toLowerCase().includes(rechargeSearch.toLowerCase())) ||
      (t.customerMobile && t.customerMobile.includes(rechargeSearch));

    let matchStatus = false;
    if (rechargeStatusFilter === "all") {
      matchStatus = !t.status || validStatuses.includes(normStatus);
    } else if (rechargeStatusFilter === "pending") {
      matchStatus = normStatus === "pending";
    } else if (rechargeStatusFilter === "success") {
      matchStatus = normStatus === "success" || normStatus === "approved";
    } else if (rechargeStatusFilter === "failed") {
      matchStatus = normStatus === "failed" || normStatus === "rejected";
    } else {
      matchStatus = normStatus === rechargeStatusFilter.toLowerCase();
    }
    const op = getOperatorForRecord(t, approvedOperators);
    const matchOp =
      selectedOperatorFilter === "all" ||
      (op && (op.id === selectedOperatorFilter || op.mobile === selectedOperatorFilter));
    return matchSearch && matchStatus && matchOp;
  });

  const filteredComplaints = complaints.filter((c) => {
    const matchSearch =
      c.id.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.customerName.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.stbId.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(complaintSearch.toLowerCase());
    const matchStatus =
      complaintStatusFilter === "all" ? true : c.status === complaintStatusFilter;
    const op = getOperatorForRecord(c, approvedOperators);
    const matchOp =
      selectedOperatorFilter === "all" ||
      (op && (op.id === selectedOperatorFilter || op.mobile === selectedOperatorFilter));
    return matchSearch && matchStatus && matchOp;
  });

  return (
    <AppShell>
      {/* Top Banner */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#2563EB] text-white font-bold shadow-md shadow-blue-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-[#0F172A]">Super Admin Portal</h1>
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-[#2563EB] border border-blue-200 uppercase tracking-wider">
                MASTER CONTROL
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1 font-medium">
              Logged in as 👑 <strong>Kathiravan V</strong> (9080864542) • Master Administrative Rights
            </p>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-6 flex items-center justify-between rounded-xl p-4 text-xs font-bold ${
            msg.error
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-[#0F172A] hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* GLOBAL TAB FIX (Inactive #E2E8F0 / Active #2563EB) */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto no-scrollbar rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] p-1.5 shadow-sm">
        {[
          { id: "dashboard", label: "📊 Overview", icon: Zap },
          { id: "operators", label: "🛡️ Operators", icon: Shield },
          { id: "customers", label: "👥 Customers", icon: Users },
          { id: "recharges", label: "💳 Recharges & Payments", icon: CreditCard },
          { id: "product_requests", label: "📦 Product Requests", icon: Package },
          { id: "complaints", label: "🔧 Complaints", icon: Wrench },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as TabType)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out whitespace-nowrap ${
              tab === t.id
                ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Dashboard Overview */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              onClick={() => setTab("recharges")}
              className="cursor-pointer group rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm hover:border-[#2563EB] transition"
            >
              <div className="flex items-center justify-between text-xs text-[#64748B] uppercase font-bold">
                <span>Total Revenue</span>
                <CreditCard className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-[#2563EB] font-mono">
                ₹{totalRechargeAmount}
              </div>
              <div className="mt-1 text-xs text-[#64748B]">All successful recharges</div>
            </div>

            <div
              onClick={() => setTab("operators")}
              className="cursor-pointer group rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm hover:border-[#2563EB] transition"
            >
              <div className="flex items-center justify-between text-xs text-[#64748B] uppercase font-bold">
                <span>Approved Operators</span>
                <Shield className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-[#0F172A]">
                {approvedOperators.length}
              </div>
              <div className="mt-1 text-xs text-[#64748B]">Active operator accounts</div>
            </div>

            <div
              onClick={() => setTab("recharges")}
              className="cursor-pointer group rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm hover:border-amber-400 transition"
            >
              <div className="flex items-center justify-between text-xs text-amber-700 uppercase font-bold">
                <span>Pending Approvals</span>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-amber-600">
                {pendingRechargesCount}
              </div>
              <div className="mt-1 text-xs text-amber-700">Awaiting operator signoff</div>
            </div>

            <div
              onClick={() => setTab("complaints")}
              className="cursor-pointer group rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm hover:border-[#2563EB] transition"
            >
              <div className="flex items-center justify-between text-xs text-[#64748B] uppercase font-bold">
                <span>Open Complaints</span>
                <Wrench className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-[#2563EB]">
                {pendingComplaintsCount}
              </div>
              <div className="mt-1 text-xs text-[#64748B]">Needs technician dispatch</div>
            </div>
          </div>

          {/* Quick Nav Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div
              onClick={() => setTab("operators")}
              className="cursor-pointer rounded-2xl border border-[#CBD5E1] bg-white p-5 hover:border-[#2563EB] shadow-sm transition space-y-1.5"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-[#2563EB]" />
                <h3 className="font-bold text-[#0F172A] text-base">Manage Operators</h3>
              </div>
              <p className="text-xs text-[#64748B]">
                Add, activate, or deactivate operator whitelist access.
              </p>
            </div>

            <div
              onClick={() => setTab("customers")}
              className="cursor-pointer rounded-2xl border border-[#CBD5E1] bg-white p-5 hover:border-[#2563EB] shadow-sm transition space-y-1.5"
            >
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-[#2563EB]" />
                <h3 className="font-bold text-[#0F172A] text-base">Customer Database</h3>
              </div>
              <p className="text-xs text-[#64748B]">
                View customer profiles, STB IDs, and block/unblock users.
              </p>
            </div>

            <div
              onClick={() => setTab("product_requests")}
              className="cursor-pointer rounded-2xl border border-[#CBD5E1] bg-white p-5 hover:border-[#2563EB] shadow-sm transition space-y-1.5"
            >
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-[#2563EB]" />
                <h3 className="font-bold text-[#0F172A] text-base">Product Requests</h3>
              </div>
              <p className="text-xs text-[#64748B]">
                View customer product & service order requests, payments & fulfillment status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Approved Operators */}
      {tab === "operators" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#2563EB]" /> ADD NEW OPERATOR
              </h2>
              <span className="text-xs text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 font-bold">
                Whitelist Login
              </span>
            </div>

            <form onSubmit={handleAddOperator} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#64748B] mb-1.5 uppercase tracking-wider">
                    OPERATOR FULL NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={opName}
                    onChange={(e) => setOpName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#64748B] mb-1.5 uppercase tracking-wider">
                    MOBILE NUMBER <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={opMobile}
                    onChange={(e) => setOpMobile(e.target.value)}
                    placeholder="e.g. 9840192837"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                <div className="lg:col-span-7">
                  <label className="block text-xs font-extrabold text-[#64748B] mb-1.5 uppercase tracking-wider">
                    SELECT STB BOX NAME <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["SCV", "TCCL", "AKSHAYA DIGINET", "TACTV"] as const).map((provider) => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setOpStbBox(provider)}
                        className={`rounded-xl px-3 py-2.5 text-xs font-black transition border cursor-pointer text-center ${
                          opStbBox === provider
                            ? "bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-500/20"
                            : "bg-[#F8FAFC] text-[#334155] border-[#CBD5E1] hover:bg-slate-100"
                        }`}
                      >
                        📺 {provider}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <label className="block text-xs font-extrabold text-[#64748B] mb-1.5 uppercase tracking-wider">
                    PLACE YOUR PORTAL LINK
                  </label>
                  <input
                    type="url"
                    value={opPortalLink}
                    onChange={(e) => setOpPortalLink(e.target.value)}
                    placeholder="e.g. https://scvportal.com or tccl.in"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-6 py-2.5 text-xs font-extrabold text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> + ADD OPERATOR
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-[#0F172A]">
              <thead className="border-b border-[#CBD5E1] bg-[#F8FAFC] text-xs uppercase text-[#64748B] font-bold">
                <tr>
                  <th className="px-6 py-4">Operator Name</th>
                  <th className="px-6 py-4">Mobile</th>
                  <th className="px-6 py-4">STB Box Name</th>
                  <th className="px-6 py-4">Portal Link</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]">
                {approvedOperators.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#64748B] font-medium">
                      No operators registered. Use the form above to add an operator.
                    </td>
                  </tr>
                ) : (
                  approvedOperators.map((op) => {
                    const opCustomerCount = allCustomers.filter(
                      (c) => getOperatorForRecord(c, approvedOperators)?.id === op.id
                    ).length;

                    return (
                      <tr key={op.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-bold text-[#0F172A]">
                          <button
                            onClick={() => {
                              setSelectedOperator(op);
                              setOpModalTab("customers");
                            }}
                            className="flex items-center gap-2 hover:text-[#2563EB] hover:underline cursor-pointer font-bold text-left"
                          >
                            <Shield className="h-4 w-4 text-[#2563EB] shrink-0" />
                            {op.name}
                          </button>
                        </td>
                        <td className="px-6 py-4 font-mono">{op.mobile}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-black text-[#2563EB]">
                            📺 {op.stbBoxName || "SCV"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {op.portalLink ? (
                            <a
                              href={op.portalLink.startsWith("http") ? op.portalLink : `https://${op.portalLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
                            >
                              🔗 Open Portal
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No Link Provided</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {op.active ? (
                            <span className="text-[#22C55E] font-bold text-xs">🟢 Active</span>
                          ) : (
                            <span className="text-red-600 font-bold text-xs">🔴 Inactive</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedOperator(op);
                              setOpModalTab("customers");
                            }}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2563EB] hover:bg-blue-100 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> View ({opCustomerCount} Customers)
                          </button>
                          <button
                            onClick={() => setOperatorActive(op.id, !op.active)}
                            className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-slate-100 cursor-pointer"
                          >
                            Toggle
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove operator "${op.name}"?`)) {
                                removeApprovedOperator(op.id);
                                setMsg({ text: `Operator ${op.name} removed successfully.` });
                              }
                            }}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Customers */}
      {tab === "customers" && (
        <div className="space-y-6">
          {/* Operator Filter Selector */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[#2563EB]" /> Touch an Operator to view their specific Customers & Details
              </span>
              {selectedOperatorFilter !== "all" && (
                <button
                  onClick={() => setSelectedOperatorFilter("all")}
                  className="text-xs font-bold text-[#2563EB] hover:underline"
                >
                  Show All Customers
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedOperatorFilter("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
                  selectedOperatorFilter === "all"
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "bg-slate-100 text-[#334155] border-slate-200 hover:bg-slate-200"
                }`}
              >
                👥 All Operators ({allCustomers.length})
              </button>
              {approvedOperators.map((op) => {
                const count = allCustomers.filter(
                  (c) => getOperatorForRecord(c, approvedOperators)?.id === op.id
                ).length;
                return (
                  <button
                    key={op.id}
                    onClick={() => setSelectedOperatorFilter(op.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition border flex items-center gap-1.5 cursor-pointer ${
                      selectedOperatorFilter === op.id
                        ? "bg-[#2563EB] text-white border-[#2563EB]"
                        : "bg-blue-50 text-[#2563EB] border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" /> {op.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 flex justify-between items-center gap-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl py-2 pl-10 pr-4 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-[#0F172A]">
              <thead className="border-b border-[#CBD5E1] bg-[#F8FAFC] text-xs uppercase text-[#64748B] font-bold">
                <tr>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Mobile</th>
                  <th className="px-6 py-4">STB ID</th>
                  <th className="px-6 py-4">Assigned Operator</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]">
                {filteredCustomers.map((c, i) => {
                  const isBlocked =
                    blockedCustomers.includes(c.mobile) || blockedCustomers.includes(c.stbId);
                  const assignedOp = getOperatorForRecord(c, approvedOperators);

                  return (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-[#0F172A]">{c.name}</td>
                      <td className="px-6 py-4 font-mono">{c.mobile}</td>
                      <td className="px-6 py-4 font-mono">{c.stbId}</td>
                      <td className="px-6 py-4">
                        {assignedOp ? (
                          <button
                            onClick={() => {
                              setSelectedOperator(assignedOp);
                              setOpModalTab("customers");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#2563EB] hover:bg-blue-100 transition cursor-pointer"
                          >
                            <Shield className="h-3.5 w-3.5" /> {assignedOp.name}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Default</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            if (isBlocked) unblockCustomer(c.mobile);
                            else blockCustomer(c.mobile);
                          }}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                            isBlocked
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-red-100 text-red-800 border border-red-300"
                          }`}
                        >
                          {isBlocked ? "Unblock Customer" : "Block Customer"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Recharges */}
      {tab === "recharges" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                value={rechargeSearch}
                onChange={(e) => setRechargeSearch(e.target.value)}
                placeholder="Search transaction ID, customer, STB..."
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Filter className="h-4 w-4 text-[#64748B]" />
              {["all", "pending", "success", "failed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setRechargeStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 font-bold capitalize transition ${
                    rechargeStatusFilter === st
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-[#0F172A]">
              <thead className="border-b border-[#CBD5E1] bg-[#F8FAFC] text-xs uppercase text-[#64748B] font-bold">
                <tr>
                  <th className="px-6 py-4">Txn ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]">
                {filteredTxns.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-[#0F172A]">{t.id}</td>
                    <td className="px-6 py-4 font-bold">{t.customerName || "Customer"}</td>
                    <td className="px-6 py-4">{t.planName}</td>
                    <td className="px-6 py-4 font-mono text-[#2563EB] font-bold">₹{t.amount}</td>
                    <td className="px-6 py-4 capitalize font-bold">
                      {t.status === "pending" && (
                        <span className="text-amber-600">🟡 Pending</span>
                      )}
                      {t.status === "success" && (
                        <span className="text-[#22C55E]">🟢 Success</span>
                      )}
                      {t.status === "failed" && <span className="text-red-600">🔴 Failed</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.status === "pending" && (
                        <button
                          onClick={() => approveTxn(t.id)}
                          className="rounded-xl bg-[#22C55E] hover:bg-[#16A34A] px-3 py-1 text-xs font-bold text-white shadow-sm"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Complaints */}
      {tab === "complaints" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                value={complaintSearch}
                onChange={(e) => setComplaintSearch(e.target.value)}
                placeholder="Search complaint ID, customer, category..."
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Filter className="h-4 w-4 text-[#64748B]" />
              {["all", "Pending", "Assigned", "In Progress", "Resolved"].map((st) => (
                <button
                  key={st}
                  onClick={() => setComplaintStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 font-bold capitalize transition ${
                    complaintStatusFilter === st
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-[#0F172A]">
              <thead className="border-b border-[#CBD5E1] bg-[#F8FAFC] text-xs uppercase text-[#64748B] font-bold">
                <tr>
                  <th className="px-6 py-4">Complaint ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono text-[#2563EB] font-bold">{c.id}</td>
                    <td className="px-6 py-4 font-bold">{c.customerName}</td>
                    <td className="px-6 py-4">
                      {c.category} – {c.issueType}
                    </td>
                    <td className="px-6 py-4 font-bold">{c.status}</td>
                    <td className="px-6 py-4 text-right">
                      {c.status !== "Resolved" && (
                        <button
                          onClick={() => updateComplaintStatus(c.id, { status: "Resolved" })}
                          className="rounded-xl bg-[#22C55E] hover:bg-[#16A34A] px-3 py-1 text-xs font-bold text-white shadow-sm"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Product Requests View */}
      {tab === "product_requests" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search request ID, customer, STB, or product name..."
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Filter className="h-4 w-4 text-[#64748B]" />
              {["all", "Pending", "Processing", "Out for Delivery", "Installation Scheduled", "Completed", "Not Available"].map((st) => (
                <button
                  key={st}
                  onClick={() => setRechargeStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 font-bold transition ${
                    rechargeStatusFilter === st
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-[#0F172A]">
              <thead className="border-b border-[#CBD5E1] bg-[#F8FAFC] text-xs uppercase text-[#64748B] font-bold">
                <tr>
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Product / Service</th>
                  <th className="px-6 py-4">Qty & Price</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]">
                {productRequests.filter((pr) => {
                  const q = productSearch.trim().toLowerCase();
                  const matchesSearch =
                    !q ||
                    pr.id.toLowerCase().includes(q) ||
                    pr.customerName.toLowerCase().includes(q) ||
                    pr.stbId.toLowerCase().includes(q) ||
                    pr.productName.toLowerCase().includes(q) ||
                    pr.customerMobile.includes(q);
                  const matchesStatus =
                    rechargeStatusFilter === "all" ? true : pr.status === rechargeStatusFilter;
                  return matchesSearch && matchesStatus;
                }).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#64748B] font-medium">
                      No product requests found.
                    </td>
                  </tr>
                ) : (
                  productRequests
                    .filter((pr) => {
                      const q = productSearch.trim().toLowerCase();
                      const matchesSearch =
                        !q ||
                        pr.id.toLowerCase().includes(q) ||
                        pr.customerName.toLowerCase().includes(q) ||
                        pr.stbId.toLowerCase().includes(q) ||
                        pr.productName.toLowerCase().includes(q) ||
                        pr.customerMobile.includes(q);
                      const matchesStatus =
                        rechargeStatusFilter === "all" ? true : pr.status === rechargeStatusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map((pr) => (
                      <tr key={pr.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-mono font-bold text-[#2563EB]">{pr.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#0F172A]">{pr.customerName}</div>
                          <div className="text-xs text-[#64748B]">
                            STB: <strong className="font-mono text-[#0F172A]">{pr.stbId}</strong> • {pr.customerMobile}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#0F172A]">{pr.productName}</td>
                        <td className="px-6 py-4 font-mono">
                          {pr.quantity} x ₹{pr.unitPrice}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-[#22C55E]">
                          ₹{pr.totalAmount}
                        </td>
                        <td className="px-6 py-4 font-bold">{pr.status}</td>
                        <td className="px-6 py-4 text-right">
                          {pr.status !== "Completed" && (
                            <button
                              onClick={() => updateProductStatus(pr.id, { status: "Completed" })}
                              className="rounded-xl bg-[#22C55E] hover:bg-[#16A34A] px-3 py-1 text-xs font-bold text-white shadow-sm cursor-pointer"
                            >
                              Mark Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comprehensive Selected Operator Detail Modal */}
      {selectedOperator && (() => {
        const opCustomers = allCustomers.filter(
          (c) => getOperatorForRecord(c, approvedOperators)?.id === selectedOperator.id
        );
        const opTxns = txns.filter(
          (t) => getOperatorForRecord(t, approvedOperators)?.id === selectedOperator.id
        );
        const opComplaints = complaints.filter(
          (c) => getOperatorForRecord(c, approvedOperators)?.id === selectedOperator.id
        );
        const opProductReqs = productRequests.filter(
          (p) => getOperatorForRecord(p, approvedOperators)?.id === selectedOperator.id
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#0F172A] flex items-center gap-2">
                      Operator: {selectedOperator.name}
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          selectedOperator.active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedOperator.active ? "🟢 Active" : "🔴 Inactive"}
                      </span>
                    </h3>
                    <p className="text-xs text-[#64748B] font-semibold">
                      Contact: <strong>{selectedOperator.mobile}</strong> • Added:{" "}
                      {new Date(selectedOperator.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOperator(null)}
                  className="rounded-xl border border-[#CBD5E1] p-2 text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Operator Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-center">
                  <div className="text-[11px] font-bold uppercase text-[#64748B]">Customers</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#2563EB]">
                    {opCustomers.length}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                  <div className="text-[11px] font-bold uppercase text-[#64748B]">Recharges</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#22C55E]">{opTxns.length}</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-center">
                  <div className="text-[11px] font-bold uppercase text-[#64748B]">Complaints</div>
                  <div className="mt-1 text-2xl font-extrabold text-amber-600">
                    {opComplaints.length}
                  </div>
                </div>
                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-center">
                  <div className="text-[11px] font-bold uppercase text-[#64748B]">
                    Product Orders
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-purple-600">
                    {opProductReqs.length}
                  </div>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex gap-2 border-b border-[#CBD5E1] pb-2">
                {[
                  { id: "customers", label: `👥 Customers (${opCustomers.length})` },
                  { id: "recharges", label: `💳 Recharges (${opTxns.length})` },
                  { id: "complaints", label: `🔧 Complaints (${opComplaints.length})` },
                  { id: "products", label: `📦 Products (${opProductReqs.length})` },
                ].map((mt) => (
                  <button
                    key={mt.id}
                    onClick={() => setOpModalTab(mt.id as any)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                      opModalTab === mt.id
                        ? "bg-[#2563EB] text-white shadow-sm"
                        : "bg-slate-100 text-[#334155] hover:bg-slate-200"
                    }`}
                  >
                    {mt.label}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="overflow-x-auto min-h-[220px]">
                {opModalTab === "customers" && (
                  <table className="w-full text-left text-xs text-[#0F172A]">
                    <thead className="bg-[#F8FAFC] font-bold text-[#64748B] border-b border-[#CBD5E1]">
                      <tr>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3">Mobile</th>
                        <th className="p-3">STB ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CBD5E1]">
                      {opCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-[#64748B]">
                            No customers assigned to this operator.
                          </td>
                        </tr>
                      ) : (
                        opCustomers.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3 font-bold">{c.name}</td>
                            <td className="p-3 font-mono">{c.mobile}</td>
                            <td className="p-3 font-mono">{c.stbId}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {opModalTab === "recharges" && (
                  <table className="w-full text-left text-xs text-[#0F172A]">
                    <thead className="bg-[#F8FAFC] font-bold text-[#64748B] border-b border-[#CBD5E1]">
                      <tr>
                        <th className="p-3">Txn ID</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Pack / Plan</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CBD5E1]">
                      {opTxns.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-[#64748B]">
                            No recharges recorded for this operator.
                          </td>
                        </tr>
                      ) : (
                        opTxns.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold">{t.id}</td>
                            <td className="p-3 font-bold">{t.customerName || "Customer"}</td>
                            <td className="p-3">{t.planName}</td>
                            <td className="p-3 font-mono font-bold text-[#2563EB]">₹{t.amount}</td>
                            <td className="p-3 capitalize font-bold">
                              {String(t.status) === "success" || String(t.status) === "approved" ? (
                                <span className="text-[#22C55E]">🟢 Success</span>
                              ) : t.status === "pending" ? (
                                <span className="text-amber-600">🟡 Pending</span>
                              ) : (
                                <span className="text-red-600">🔴 Failed</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {opModalTab === "complaints" && (
                  <table className="w-full text-left text-xs text-[#0F172A]">
                    <thead className="bg-[#F8FAFC] font-bold text-[#64748B] border-b border-[#CBD5E1]">
                      <tr>
                        <th className="p-3">Complaint ID</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Issue</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CBD5E1]">
                      {opComplaints.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-[#64748B]">
                            No complaints filed under this operator.
                          </td>
                        </tr>
                      ) : (
                        opComplaints.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-[#2563EB]">{c.id}</td>
                            <td className="p-3 font-bold">{c.customerName}</td>
                            <td className="p-3">{c.category}</td>
                            <td className="p-3">{c.issueType}</td>
                            <td className="p-3 font-bold">{c.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {opModalTab === "products" && (
                  <table className="w-full text-left text-xs text-[#0F172A]">
                    <thead className="bg-[#F8FAFC] font-bold text-[#64748B] border-b border-[#CBD5E1]">
                      <tr>
                        <th className="p-3">Request ID</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CBD5E1]">
                      {opProductReqs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-[#64748B]">
                            No product orders under this operator.
                          </td>
                        </tr>
                      ) : (
                        opProductReqs.map((pr) => (
                          <tr key={pr.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold">{pr.id}</td>
                            <td className="p-3 font-bold">{pr.customerName}</td>
                            <td className="p-3">{pr.productName}</td>
                            <td className="p-3 font-mono font-bold text-[#22C55E]">
                              ₹{pr.totalAmount}
                            </td>
                            <td className="p-3 font-bold">{pr.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="pt-3 border-t border-[#CBD5E1] flex justify-end">
                <button
                  onClick={() => setSelectedOperator(null)}
                  className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </AppShell>
  );
}

export default AdminPage;
