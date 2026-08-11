import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  useStore,
  approveTxn,
  rejectTxn,
  logout,
  formatName,
  updateProductStatus,
  upsertProduct,
  removeProduct,
  updateComplaintStatus,
  setState,
  syncPendingRechargesFromBackend,
  syncProductRequestsFromBackend,
  syncComplaintsFromBackend,
  syncOperatorsFromBackend,
  syncStbMappingsFromBackend,
  addStbMapping,
  deleteStbMappingAction,
  isOperatorApproved,
  cleanContact,
  type ProductRequest,
  type Product,
  type ProductRequestStatus,
  type Complaint,
  type ComplaintStatus,
  type StbMapping,
} from "../services/store";


import {
  Tv,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  Shield,
  Zap,
  AlertTriangle,
  Package,
  Wrench,
  Truck,
  Phone,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  ShoppingBag,
  MessageCircle,
  Car,
  Lock,
} from "lucide-react";

function ProductStatusBadge({ status }: { status: ProductRequestStatus }) {
  switch (status) {
    case "Pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> 🟡 Pending
        </span>
      );
    case "Processing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" /> 🔵 Processing
        </span>
      );
    case "Out for Delivery":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-300 bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
          <Truck className="h-3.5 w-3.5" /> 🚚 Out for Delivery
        </span>
      );
    case "Installation Scheduled":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
          <Wrench className="h-3.5 w-3.5" /> 🛠️ Installation Scheduled
        </span>
      );
    case "Completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" /> 🟢 Completed
        </span>
      );
    case "Not Available":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
          <AlertTriangle className="h-3.5 w-3.5" /> 🔴 Not Available
        </span>
      );
    default:
      return null;
  }
}

function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  switch (status) {
    case "Pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> 🟡 Pending
        </span>
      );
    case "Assigned":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" /> 🔵 Assigned
        </span>
      );
    case "In Progress":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          <Car className="h-3.5 w-3.5 animate-bounce text-amber-600" /> 🟠 In Progress
        </span>
      );
    case "Resolved":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" /> 🟢 Resolved
        </span>
      );
    default:
      return null;
  }
}

export function OperatorPage() {
  const user = useStore((s) => s.user);
  const txns = useStore((s) => s.txns);
  const products = useStore((s) => s.products);
  const productRequests = useStore((s) => s.productRequests);
  const complaints = useStore((s) => s.complaints);
  const stbMappings = useStore((s) => s.stbMappings);
  const approvedOperators = useStore((s) => s.approvedOperators);
  const navigate = useNavigate();

  const currentOpInfo = approvedOperators.find(
    (op) =>
      op.mobile === user?.mobile ||
      (op.name && user?.name && op.name.toLowerCase().trim() === user.name.toLowerCase().trim())
  );

  // Navigation Menu Tabs: "txns" | "stb_mapping" | "product_requests" | "stock" | "complaints"
  const [activeMenu, setActiveMenu] = useState<
    "txns" | "stb_mapping" | "product_requests" | "stock" | "complaints"
  >("txns");

  // STB ID Mapping State
  const [stbSearchTerm, setStbSearchTerm] = useState("");
  const [showAddStbModal, setShowAddStbModal] = useState(false);
  const [newStbId, setNewStbId] = useState("");
  const [newCustName, setNewCustName] = useState("");
  const [newCustMobile, setNewCustMobile] = useState("");
  const [stbSubmitting, setStbSubmitting] = useState(false);
  const [stbErr, setStbErr] = useState<string | null>(null);

  // Search & filter state for txns
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "success" | "failed">("all");

  // Search & Filter state for product requests
  const [productReqSearch, setProductReqSearch] = useState("");
  const [productReqStatusFilter, setProductReqStatusFilter] = useState<string>("all");

  // Search & Filter state for complaints
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>("all");

  // Scheduling Product Modal State
  const [schedulingReq, setSchedulingReq] = useState<ProductRequest | null>(null);
  const [techName, setTechName] = useState(user?.name || "");
  const [techPhone, setTechPhone] = useState(user?.mobile || "");
  const [schedDate, setSchedDate] = useState("Tomorrow at 11:00 AM");

  // Complaint Technician Assignment Modal State
  const [assigningComplaint, setAssigningComplaint] = useState<Complaint | null>(null);
  const [cmpTechName, setCmpTechName] = useState(user?.name || "");
  const [cmpTechPhone, setCmpTechPhone] = useState(user?.mobile || "");
  const [cmpExpectedArrival, setCmpExpectedArrival] = useState("In 20 Minutes");

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editNameVal, setEditNameVal] = useState<string>("");
  const [editCategoryVal, setEditCategoryVal] = useState<"accessory" | "service">("accessory");
  const [editStockVal, setEditStockVal] = useState<number>(0);
  const [editPriceVal, setEditPriceVal] = useState<number>(0);
  const [editDescVal, setEditDescVal] = useState<string>("");

  // Add Product Modal State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState<"accessory" | "service">("accessory");
  const [newProdPrice, setNewProdPrice] = useState<number>(150);
  const [newProdStock, setNewProdStock] = useState<number>(10);
  const [newProdDesc, setNewProdDesc] = useState("");

  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const op = user?.mobile || user?.operatorNumber || "";
    syncPendingRechargesFromBackend(op);
    syncProductRequestsFromBackend();
    syncComplaintsFromBackend();
    syncOperatorsFromBackend();
    if (op) syncStbMappingsFromBackend(op);

    const interval = setInterval(() => {
      syncPendingRechargesFromBackend(op);
      syncProductRequestsFromBackend();
      syncComplaintsFromBackend();
      if (op) syncStbMappingsFromBackend(op);
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    console.log("Updated requests:", txns);
    console.log("Statuses:", txns.map((t) => t.status));
  }, [txns]);

  const cleanMob = cleanContact(user?.mobile || "");
  const isApprovedOp =
    user?.role === "admin" ||
    (cleanMob &&
      approvedOperators.some(
        (o) => o.active !== false && cleanContact(o.mobile) === cleanMob,
      ));

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!isApprovedOp && user.role !== "admin") {
      navigate({ to: "/login" });
    }
  }, [user, isApprovedOp, navigate]);

  if (!user || (!isApprovedOp && user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600 mx-auto font-bold">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[#0F172A]">Operator Access Denied</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Mobile number <strong>+91 {user?.mobile}</strong> is not registered as an active operator in the Admin Whitelist database.
            Please contact Super Admin (Kathiravan V) to register your operator account.
          </p>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-xs font-bold text-white shadow-md transition cursor-pointer"
          >
            Back to Operator Login
          </button>
        </div>
      </div>
    );
  }


  // Summary counts with case-insensitive & multi-state filtering
  const validPendingStatuses = ["pending"];
  const validApprovedStatuses = ["success", "approved"];
  const validFailedStatuses = ["failed", "rejected"];

  const totalCount = txns.length;
  const pendingCount = txns.filter(
    (t) => t.status && validPendingStatuses.includes(String(t.status).toLowerCase()),
  ).length;
  const approvedCount = txns.filter(
    (t) => t.status && validApprovedStatuses.includes(String(t.status).toLowerCase()),
  ).length;
  const failedCount = txns.filter(
    (t) => t.status && validFailedStatuses.includes(String(t.status).toLowerCase()),
  ).length;

  const pendingProductReqsCount = productRequests.filter((r) => (r.status || "").toLowerCase() === "pending").length;
  const lowStockCount = products.filter(
    (p) => p.category === "accessory" && p.availableStock <= 5,
  ).length;
  const pendingComplaintsCount = complaints.filter((c) => {
    const cs = (c.status || "").toLowerCase();
    return cs === "pending" || cs === "assigned" || cs === "in progress";
  }).length;

  // Filtered transactions with safe Array.isArray check and case-insensitive multi-state filtering
  const safeTxns = Array.isArray(txns) ? txns : [];
  const validStatuses = ["pending", "success", "approved", "failed", "rejected"];

  const filteredTxns = safeTxns.filter((t) => {
    if (!t) return false;
    const normStatus = t.status ? String(t.status).toLowerCase() : "";

    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = !t.status || validStatuses.includes(normStatus);
    } else if (statusFilter === "pending") {
      matchesStatus = normStatus === "pending";
    } else if (statusFilter === "success") {
      matchesStatus = normStatus === "success" || normStatus === "approved";
    } else if (statusFilter === "failed") {
      matchesStatus = normStatus === "failed" || normStatus === "rejected";
    }

    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (t.stbId && String(t.stbId).toLowerCase().includes(q)) ||
      (t.customerMobile && String(t.customerMobile).toLowerCase().includes(q)) ||
      (t.customerName && String(t.customerName).toLowerCase().includes(q)) ||
      (t.planName && String(t.planName).toLowerCase().includes(q)) ||
      (t.id && String(t.id).toLowerCase().includes(q));

    return matchesSearch && matchesStatus;
  });

  // Filtered Product Requests
  const filteredProductRequests = productRequests.filter((r) => {
    const q = productReqSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (r.customerName && r.customerName.toLowerCase().includes(q)) ||
      (r.stbId && r.stbId.toLowerCase().includes(q)) ||
      (r.productName && r.productName.toLowerCase().includes(q)) ||
      (r.customerMobile && r.customerMobile.includes(q)) ||
      (r.id && r.id.toLowerCase().includes(q));
    const matchesStatus =
      productReqStatusFilter === "all" ? true : r.status === productReqStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Complaints
  const filteredComplaints = complaints.filter((c) => {
    const q = complaintSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.customerName && c.customerName.toLowerCase().includes(q)) ||
      (c.stbId && c.stbId.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.issueType && c.issueType.toLowerCase().includes(q)) ||
      (c.customerMobile && c.customerMobile.includes(q));
    const matchesStatus =
      complaintStatusFilter === "all" ? true : c.status === complaintStatusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleRejectTxn(id: string) {
    rejectTxn(id);
  }

  function handleSaveProductUpdate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!editingProduct) return;
    upsertProduct({
      id: editingProduct.id,
      name: editNameVal || editingProduct.name,
      category: editCategoryVal || editingProduct.category,
      availableStock: editStockVal,
      price: editPriceVal,
      description: editDescVal,
    });
    setEditingProduct(null);
  }
  const handleSaveStockUpdate = handleSaveProductUpdate;

  function handleDeleteProduct(id: string, name?: string) {
    if (confirm(`Are you sure you want to delete product "${name || id}"?`)) {
      removeProduct(id);
      if (editingProduct?.id === id) {
        setEditingProduct(null);
      }
    }
  }

  function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newProdName.trim()) return;
    upsertProduct({
      id: "prod-" + Date.now(),
      name: newProdName.trim(),
      category: newProdCategory,
      price: Number(newProdPrice),
      availableStock: Number(newProdStock),
      description: newProdDesc.trim(),
    });
    setShowAddProduct(false);
    setNewProdName("");
    setNewProdDesc("");
  }

  async function handleAddStbSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStbErr(null);
    const cleanStb = newStbId.trim().toUpperCase().slice(0, 12);
    if (!cleanStb) {
      setStbErr("Please enter a valid STB ID");
      return;
    }
    if (cleanStb.length > 12) {
      setStbErr("STB ID cannot exceed 12 characters!");
      return;
    }
    setStbSubmitting(true);
    const res = await addStbMapping({
      stbId: cleanStb,
      operatorMobile: user?.mobile || "",
      operatorName: user?.name || "Operator",
      customerName: "Customer",
      customerMobile: "",
    });
    setStbSubmitting(false);

    if (res.success) {
      setShowAddStbModal(false);
      setNewStbId("");
    } else {
      setStbErr(res.message || "Failed to map STB ID");
    }
  }

  function handleDeleteStbMapping(id: string) {
    if (confirm("Are you sure you want to unmap/delete this STB ID?")) {
      deleteStbMappingAction(id, user?.mobile);
    }
  }

  function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schedulingReq) return;
    updateProductStatus(schedulingReq.id, {
      status: "Installation Scheduled",
      technicianName: techName,
      technicianMobile: techPhone,
      scheduledDate: schedDate,
    });
    setSchedulingReq(null);
  }

  function handleAssignComplaintSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assigningComplaint) return;
    updateComplaintStatus(assigningComplaint.id, {
      status: "Assigned",
      technicianName: cmpTechName.trim(),
      technicianMobile: cmpTechPhone.trim(),
      expectedArrival: cmpExpectedArrival.trim(),
      assignedAt: new Date().toISOString(),
    });
    setAssigningComplaint(null);
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-sans antialiased">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#CBD5E1] shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563EB] text-white shadow-md shadow-blue-500/20 font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
                STB RECHARGE
                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] uppercase font-bold text-[#2563EB]">
                  Operator Control Center
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] flex items-center gap-2 flex-wrap font-medium">
                <span>
                  Logged in:{" "}
                  <strong className="font-bold text-[#0F172A]">
                    {formatName(currentOpInfo?.name || user.name || "Operator Admin")}
                  </strong>{" "}
                  (+91 {user.mobile})
                </span>
                {currentOpInfo?.stbBoxName && (
                  <span className="rounded-md border border-blue-300 bg-blue-100 px-2 py-0.5 text-[10px] uppercase font-black text-[#2563EB]">
                    📺 {currentOpInfo.stbBoxName}
                  </span>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 text-[#22C55E] font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]"></span>
                  </span>
                  Live Sync Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                try {
                  localStorage.removeItem("stb_recharge_local_state_v1");
                } catch (e) {}
                window.location.reload();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#64748B] transition hover:bg-slate-100 hover:text-[#0F172A] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Sync Now
            </button>

            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Top Header Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#2563EB] font-bold">
              Operator Dashboard
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              Welcome, {formatName(currentOpInfo?.name || user.name || "Operator")} 👋
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-[#64748B]">
              Manage customer recharges, product requests, inventory stock & support complaints.
            </p>
          </div>

          {/* Operator Details & Portal Link Card */}
          <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-[#CBD5E1] p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
              <Shield className="h-4 w-4 text-[#2563EB]" />
              <span>Mobile: <strong className="font-mono">{user.mobile}</strong></span>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-[#64748B]">STB Provider:</span>
              <span className="rounded-lg bg-blue-100 border border-blue-200 px-2.5 py-1 text-xs font-black text-[#2563EB]">
                📺 {currentOpInfo?.stbBoxName || "SCV"}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <a
              href={
                currentOpInfo?.portalLink
                  ? (currentOpInfo.portalLink.startsWith("http") ? currentOpInfo.portalLink : `https://${currentOpInfo.portalLink}`)
                  : (currentOpInfo?.stbBoxName === "TCCL" ? "https://tccl.in" : currentOpInfo?.stbBoxName === "AKSHAYA DIGINET" ? "https://akshayadiginet.in" : currentOpInfo?.stbBoxName === "TACTV" ? "https://tactv.in" : "https://scvportal.com")
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm transition cursor-pointer"
            >
              🔗 Open {currentOpInfo?.stbBoxName || "SCV"} Portal
            </a>
          </div>
        </div>

        {/* COMPACT ELEGANT STB ID MAPPING CARD */}
        <div className="mb-6 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-4 text-white shadow-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-inner">
                <Tv className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-base font-bold text-white tracking-tight">
                    STB ID Mapping Portal
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {stbMappings.length} Mapped
                  </span>
                </div>
                <p className="text-[11px] text-blue-100/90 font-medium">
                  Map customer STB IDs to authorize recharges for your operator account.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setShowAddStbModal(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-extrabold text-blue-700 hover:bg-blue-50 shadow transition transform active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-blue-600" /> Map New STB ID
              </button>
              <button
                onClick={() => setActiveMenu("stb_mapping")}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition border cursor-pointer ${
                  activeMenu === "stb_mapping"
                    ? "bg-white/30 border-white text-white shadow-inner"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                }`}
              >
                <Tv className="h-3.5 w-3.5" /> STB List ({stbMappings.length})
              </button>
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs Bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] p-1.5 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveMenu("txns")}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out whitespace-nowrap ${
                activeMenu === "txns"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <Zap className="h-4 w-4" /> Recharge Txns ({pendingCount})
            </button>

            <button
              onClick={() => setActiveMenu("stb_mapping")}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out whitespace-nowrap ${
                activeMenu === "stb_mapping"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <Tv className="h-4 w-4" /> STB ID Mapping ({stbMappings.length})
            </button>

            <button
              onClick={() => setActiveMenu("product_requests")}
              className={`relative flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out whitespace-nowrap ${
                activeMenu === "product_requests"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <Package className="h-4 w-4" /> Product Requests
              {pendingProductReqsCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-black">
                  {pendingProductReqsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveMenu("stock")}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out whitespace-nowrap ${
                activeMenu === "stock"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <ShoppingBag className="h-4 w-4" /> Stock Management
              {lowStockCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  ⚠️ {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveMenu("complaints")}
              className={`relative flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out whitespace-nowrap ${
                activeMenu === "complaints"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <Wrench className="h-4 w-4" /> Complaints
              {pendingComplaintsCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-black">
                  {pendingComplaintsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* MENU 1: Recharge Transactions View */}
        {activeMenu === "txns" && (
          <>
            {/* Summary Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                    Total Requests
                  </span>
                  <Tv className="h-5 w-5 text-[#2563EB]" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-[#0F172A]">{totalCount}</div>
                <div className="mt-1 text-xs text-[#64748B]">All customer transactions</div>
              </div>

              <div className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-amber-700">
                    Pending
                  </span>
                  <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-amber-600">{pendingCount}</div>
                <div className="mt-1 text-xs text-amber-700">Awaiting operator approval</div>
              </div>

              <div className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#22C55E]">
                    Approved
                  </span>
                  <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-[#22C55E]">{approvedCount}</div>
                <div className="mt-1 text-xs text-emerald-700">Successfully activated</div>
              </div>

              <div className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-red-600">
                    Failed
                  </span>
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-red-600">{failedCount}</div>
                <div className="mt-1 text-xs text-red-700">Rejected transactions</div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-6 bg-white rounded-2xl border border-[#CBD5E1] p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search STB ID, Customer Name, Mobile or Txn ID..."
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#64748B]" />
                  {(["all", "pending", "success", "failed"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                        statusFilter === st
                          ? "bg-[#2563EB] text-white"
                          : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Txn Cards & Table */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#CBD5E1] bg-[#F8FAFC] text-xs uppercase text-[#64748B] font-bold">
                    <tr>
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4">STB ID & Customer</th>
                      <th className="px-6 py-4">Plan Name</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBD5E1]">
                    {Array.isArray(filteredTxns) && filteredTxns.length > 0 ? (
                      filteredTxns.map((t, index) => (
                        <tr key={(t as any)._id || t.id || index} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-[#0F172A]">{t.id}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-[#0F172A]">
                              {t.customerName || "Customer"}
                            </div>
                            <div className="text-xs font-semibold text-[#64748B]">
                              STB: <span className="font-mono text-[#0F172A]">{t.stbId}</span> · +91 {t.customerMobile}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-[#0F172A]">{t.planName}</td>
                          <td className="px-6 py-4 font-mono font-extrabold text-[#2563EB]">
                            ₹{t.amount}
                          </td>
                          <td className="px-6 py-4">
                            {String(t.status || "").toLowerCase() === "pending" && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />{" "}
                                Pending Approval
                              </span>
                            )}
                            {(String(t.status || "").toLowerCase() === "success" || String(t.status || "").toLowerCase() === "approved") && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" /> Approved
                              </span>
                            )}
                            {(String(t.status || "").toLowerCase() === "failed" || String(t.status || "").toLowerCase() === "rejected") && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                                <XCircle className="h-3.5 w-3.5" /> Rejected
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {String(t.status || "").toLowerCase() === "pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => approveTxn(t.id)}
                                  className="flex items-center gap-1 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition"
                                >
                                  <Check className="h-3.5 w-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectTxn(t.id)}
                                  className="flex items-center gap-1 rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition"
                                >
                                  <X className="h-3.5 w-3.5" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-[#64748B] font-mono font-semibold">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[#64748B] font-medium">
                          <p className="text-[#64748B]">No requests found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* MENU 2: STB ID Mapping & Management View */}
        {activeMenu === "stb_mapping" && (
          <div className="space-y-6">
            {/* Header & Add Button */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Tv className="h-5 w-5 text-[#2563EB]" /> STB ID Mapping & Management
                </h2>
                <p className="text-xs text-[#64748B] mt-1 font-medium">
                  Map and approve STB IDs for your operator account. Only approved STB IDs can be recharged by customers.
                </p>
              </div>

              <button
                onClick={() => setShowAddStbModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition shrink-0"
              >
                <Plus className="h-4 w-4" /> Map / Add New STB ID
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                <input
                  type="text"
                  value={stbSearchTerm}
                  onChange={(e) => setStbSearchTerm(e.target.value)}
                  placeholder="Search STB ID, Customer Name, Mobile Number, or Plan..."
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* STB Mappings Table */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#CBD5E1] bg-[#F8FAFC] text-xs uppercase text-[#64748B] font-bold">
                    <tr>
                      <th className="px-6 py-4">STB ID</th>
                      <th className="px-6 py-4">Customer Name & Mobile</th>
                      <th className="px-6 py-4">Current Plan</th>
                      <th className="px-6 py-4">Expiry Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBD5E1]">
                    {stbMappings.filter((m) => {
                      const q = stbSearchTerm.trim().toLowerCase();
                      return (
                        !q ||
                        (m.stbId && m.stbId.toLowerCase().includes(q)) ||
                        (m.customerName && m.customerName.toLowerCase().includes(q)) ||
                        (m.customerMobile && m.customerMobile.includes(q)) ||
                        (m.currentPlan && m.currentPlan.toLowerCase().includes(q))
                      );
                    }).length > 0 ? (
                      stbMappings
                        .filter((m) => {
                          const q = stbSearchTerm.trim().toLowerCase();
                          return (
                            !q ||
                            (m.stbId && m.stbId.toLowerCase().includes(q)) ||
                            (m.customerName && m.customerName.toLowerCase().includes(q)) ||
                            (m.customerMobile && m.customerMobile.includes(q)) ||
                            (m.currentPlan && m.currentPlan.toLowerCase().includes(q))
                          );
                        })
                        .map((m) => (
                          <tr key={m.id || m._id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 font-mono font-extrabold text-[#2563EB] text-sm">
                              {m.stbId}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-[#0F172A]">
                                {m.customerName || "Customer"}
                              </div>
                              <div className="text-xs font-medium text-[#64748B]">
                                {m.customerMobile ? `+91 ${m.customerMobile}` : "No Mobile Added"}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-semibold text-[#0F172A]">
                              {m.currentPlan || "Basic Tamil Pack Monthly Rs 220"}
                            </td>
                            <td className="px-6 py-4 text-xs font-mono font-bold text-[#64748B]">
                              {m.expiryDate
                                ? new Date(m.expiryDate).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> Approved & Active
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteStbMapping(m.id || m._id || "")}
                                className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                                title="Unmap STB ID"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[#64748B] font-medium">
                          <p className="text-[#64748B]">No mapped STB IDs found for your operator account.</p>
                          <button
                            onClick={() => setShowAddStbModal(true)}
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
                          >
                            + Map your first STB ID
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MENU 3: Product & Service Requests View */}
        {activeMenu === "product_requests" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                  <input
                    type="text"
                    value={productReqSearch}
                    onChange={(e) => setProductReqSearch(e.target.value)}
                    placeholder="Search Customer Name, STB ID, Product Name, or Mobile..."
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[#64748B] font-bold">Status Filter:</span>
                  {[
                    "all",
                    "Pending",
                    "Processing",
                    "Out for Delivery",
                    "Installation Scheduled",
                    "Completed",
                    "Not Available",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setProductReqStatusFilter(s)}
                      className={`rounded-lg px-3 py-1.5 font-bold transition ${
                        productReqStatusFilter === s
                          ? "bg-[#2563EB] text-white"
                          : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {filteredProductRequests.length === 0 ? (
                <div className="md:col-span-2 bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-12 text-center shadow-sm">
                  <Package className="mx-auto h-12 w-12 text-[#64748B]" />
                  <h3 className="mt-3 font-bold text-lg text-[#0F172A]">
                    No product requests found
                  </h3>
                </div>
              ) : (
                filteredProductRequests.map((req) => {
                  const targetProd = products.find((p) => p.id === req.productId);
                  const isStockAvailable = targetProd ? targetProd.availableStock > 0 : true;

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm space-y-4 hover:border-[#2563EB] transition"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-[#CBD5E1] pb-4">
                        <div>
                          <div className="text-xs font-mono font-bold text-[#2563EB]">
                            REQ ID: {req.id}
                          </div>
                          <h3 className="text-lg font-bold text-[#0F172A] mt-0.5">
                            {req.customerName}
                          </h3>
                          <div className="text-xs text-[#64748B] flex items-center gap-2 mt-1">
                            <span>
                              STB ID: <strong className="text-[#0F172A] font-mono">{req.stbId}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Mobile: <strong className="text-[#0F172A]">{req.customerMobile}</strong>
                            </span>
                          </div>
                        </div>
                        <ProductStatusBadge status={req.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-4 text-xs">
                        <div>
                          <span className="text-[#64748B] block text-[10px] uppercase font-bold">
                            Product / Service
                          </span>
                          <strong className="text-[#0F172A] text-sm">
                            {req.productName}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#64748B] block text-[10px] uppercase font-bold">
                            Stock Availability
                          </span>
                          <strong
                            className={
                              isStockAvailable ? "text-[#22C55E]" : "text-red-600 font-bold"
                            }
                          >
                            {req.category === "service"
                              ? "Service Available"
                              : isStockAvailable
                                ? `In Stock (${targetProd?.availableStock} avail)`
                                : "⚠️ Out of Stock"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#64748B] block text-[10px] uppercase font-bold">
                            Quantity & Price
                          </span>
                          <strong className="text-[#0F172A]">
                            {req.quantity} x ₹{req.unitPrice}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#64748B] block text-[10px] uppercase font-bold">
                            Total Price
                          </span>
                          <strong className="text-[#2563EB] text-sm font-mono font-bold">
                            ₹{req.totalAmount}
                          </strong>
                        </div>
                      </div>

                      {req.description && (
                        <div className="text-xs text-[#0F172A] bg-[#F8FAFC] p-3 rounded-xl border border-[#CBD5E1]">
                          <strong className="text-[#64748B]">Notes: </strong>{" "}
                          {req.description}
                        </div>
                      )}

                      <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#CBD5E1]">
                        <a
                          href={`tel:${req.customerMobile}`}
                          className="flex items-center gap-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#0F172A] hover:bg-slate-100"
                        >
                          <Phone className="h-3.5 w-3.5 text-[#22C55E]" /> Call
                        </a>

                        <a
                          href={`https://wa.me/91${req.customerMobile}?text=Hi%20${encodeURIComponent(req.customerName)},%20regarding%20your%20request%20${encodeURIComponent(req.productName)}...`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>

                        {req.status === "Pending" && (
                          <button
                            onClick={() =>
                              updateProductStatus(req.id, {
                                status: req.category === "service" ? "Processing" : "Out for Delivery",
                              })
                            }
                            className="flex items-center gap-1 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-2 text-xs font-bold text-white shadow-sm"
                          >
                            <Check className="h-3.5 w-3.5" /> Accept Request
                          </button>
                        )}

                        {req.category === "service" && req.status !== "Completed" && (
                          <button
                            onClick={() => setSchedulingReq(req)}
                            className="flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#2563EB] hover:bg-blue-100"
                          >
                            <Wrench className="h-3.5 w-3.5" /> Schedule Tech
                          </button>
                        )}

                        {req.status !== "Completed" && (
                          <button
                            onClick={() => updateProductStatus(req.id, { status: "Completed" })}
                            className="flex items-center gap-1 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] px-3.5 py-2 text-xs font-bold text-white shadow-sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                          </button>
                        )}

                        {req.status !== "Not Available" && req.status !== "Completed" && (
                          <button
                            onClick={() => updateProductStatus(req.id, { status: "Not Available" })}
                            className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                          >
                            <X className="h-3.5 w-3.5" /> Not Available
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* MENU 3: Stock & Inventory Management View */}
        {activeMenu === "stock" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                  📦 Stock & Inventory Management
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Maintain product availability, update price & stock quantity.
                </p>
              </div>

              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20"
              >
                <Plus className="h-4 w-4" /> Add New Product / Service
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#0F172A]">
                  <tbody className="divide-y divide-[#CBD5E1]">
                    <tr className="bg-[#F8FAFC] text-xs uppercase text-[#64748B] font-bold border-b border-[#CBD5E1]">
                      <td className="px-6 py-4">Product Name</td>
                      <td className="px-6 py-4">Category</td>
                      <td className="px-6 py-4">Price</td>
                      <td className="px-6 py-4">Available Stock</td>
                      <td className="px-6 py-4">Sold Quantity</td>
                      <td className="px-6 py-4">Remaining Stock</td>
                      <td className="px-6 py-4 text-right">Actions</td>
                    </tr>

                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-[#64748B] font-medium">
                          <Package className="mx-auto h-12 w-12 text-[#94A3B8] mb-3" />
                          <p className="text-base font-bold text-[#0F172A]">No products or services added yet</p>
                          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                            Add your first accessory product or installation service to display it in your store catalog.
                          </p>
                          <button
                            onClick={() => setShowAddProduct(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
                          >
                            <Plus className="h-4 w-4" /> Add New Product / Service
                          </button>
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => {
                        const isLowStock = p.category === "accessory" && p.availableStock <= 5;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 font-bold text-[#0F172A] flex items-center gap-2">
                              {p.category === "service" ? (
                                <Wrench className="h-4 w-4 text-[#2563EB]" />
                              ) : (
                                <Package className="h-4 w-4 text-[#2563EB]" />
                              )}
                              <div>
                                <div>{p.name}</div>
                                <span className="text-[11px] text-[#64748B] font-normal">
                                  {p.description}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              <span
                                className={`capitalize rounded-full px-2.5 py-0.5 font-bold ${
                                  p.category === "service"
                                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}
                              >
                                {p.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-[#0F172A]">₹{p.price}</td>
                            <td className="px-6 py-4 font-mono font-bold text-[#22C55E]">
                              {p.availableStock}
                            </td>
                            <td className="px-6 py-4 font-mono text-[#64748B]">{p.soldQuantity}</td>
                            <td className="px-6 py-4">
                              {p.category === "accessory" ? (
                                isLowStock ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                    ⚠️ Low Stock ({p.availableStock} left)
                                  </span>
                                ) : (
                                  <span className="font-mono text-[#22C55E] font-bold">
                                    {p.availableStock} units
                                  </span>
                                )
                              ) : (
                                <span className="text-xs text-[#2563EB] font-bold">
                                  Service Available
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setEditNameVal(p.name);
                                    setEditCategoryVal(p.category);
                                    setEditStockVal(p.availableStock);
                                    setEditPriceVal(p.price);
                                    setEditDescVal(p.description || "");
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-slate-100 cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-[#2563EB]" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MENU 4: Complaint Management View */}
        {activeMenu === "complaints" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                  <input
                    type="text"
                    value={complaintSearch}
                    onChange={(e) => setComplaintSearch(e.target.value)}
                    placeholder="Search Complaint ID, Customer Name, STB ID, Category or Mobile..."
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[#64748B] font-bold">Status Filter:</span>
                  {["all", "Pending", "Assigned", "In Progress", "Resolved"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setComplaintStatusFilter(s)}
                      className={`rounded-lg px-3 py-1.5 font-bold transition ${
                        complaintStatusFilter === s
                          ? "bg-[#2563EB] text-white"
                          : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Complaints List Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredComplaints.length === 0 ? (
                <div className="md:col-span-2 bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-12 text-center shadow-sm">
                  <Wrench className="mx-auto h-12 w-12 text-[#64748B]" />
                  <h3 className="mt-3 font-bold text-lg text-[#0F172A]">
                    No complaints found
                  </h3>
                </div>
              ) : (
                filteredComplaints.map((cmp) => (
                  <div
                    key={cmp.id}
                    className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm space-y-4 hover:border-[#2563EB] transition"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-[#CBD5E1] pb-3">
                      <div>
                        <div className="text-xs font-mono font-bold text-[#2563EB]">
                          CMP ID: {cmp.id}
                        </div>
                        <h3 className="text-lg font-bold text-[#0F172A] mt-0.5">
                          {cmp.customerName}
                        </h3>
                        <div className="text-xs text-[#64748B] flex items-center gap-2 mt-1">
                          <span>
                            STB ID: <strong className="text-[#0F172A] font-mono">{cmp.stbId}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Mobile: <strong className="text-[#0F172A]">{cmp.customerMobile}</strong>
                          </span>
                        </div>
                      </div>
                      <ComplaintStatusBadge status={cmp.status} />
                    </div>

                    <div className="rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-3.5 text-xs space-y-1">
                      <div className="text-[#2563EB] font-bold uppercase text-[10px]">
                        Issue Type & Category
                      </div>
                      <div className="text-[#0F172A] text-base font-bold">
                        {cmp.category} – {cmp.issueType}
                      </div>
                      <div className="text-[#64748B] text-[11px] mt-1">
                        Preferred Time: <strong className="text-[#0F172A]">{cmp.preferredTime}</strong>{" "}
                        · Created {new Date(cmp.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-xs text-[#0F172A] bg-[#F8FAFC] p-3 rounded-xl border border-[#CBD5E1]">
                      <strong className="text-[#64748B]">Description: </strong>{" "}
                      {cmp.description}
                    </div>

                    {/* Technician details if assigned */}
                    {cmp.technicianName && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-[#0F172A] space-y-1">
                        <div className="font-bold text-[#2563EB] flex items-center gap-1.5">
                          <Car className="h-4 w-4 text-[#2563EB]" /> Assigned Technician Details
                        </div>
                        <div>
                          Name: <strong>{cmp.technicianName}</strong> (+91 {cmp.technicianMobile})
                        </div>
                        <div>
                          Expected Arrival:{" "}
                          <strong className="text-[#22C55E]">
                            {cmp.expectedArrival || "In 20 Minutes"}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Operator Complaint Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#CBD5E1]">
                      <a
                        href={`tel:${cmp.customerMobile}`}
                        className="flex items-center gap-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#0F172A] hover:bg-slate-100"
                      >
                        <Phone className="h-3.5 w-3.5 text-[#22C55E]" /> Call
                      </a>

                      <a
                        href={`https://wa.me/91${cmp.customerMobile}?text=Hello%20${encodeURIComponent(cmp.customerName)},%20regarding%20your%20STB%20complaint%20${encodeURIComponent(cmp.id)}...`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>

                      {cmp.status === "Pending" && (
                        <button
                          onClick={() => updateComplaintStatus(cmp.id, { status: "Assigned" })}
                          className="flex items-center gap-1 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-2 text-xs font-bold text-white shadow-sm"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept Complaint
                        </button>
                      )}

                      {cmp.status !== "Resolved" && (
                        <button
                          onClick={() => {
                            setAssigningComplaint(cmp);
                            setCmpTechName(cmp.technicianName || user?.name || "");
                            setCmpTechPhone(cmp.technicianMobile || user?.mobile || "");
                            setCmpExpectedArrival(cmp.expectedArrival || "In 20 Minutes");
                          }}
                          className="flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-100 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-200"
                        >
                          <Car className="h-3.5 w-3.5" /> Assign Technician
                        </button>
                      )}

                      {cmp.status !== "Resolved" && (
                        <button
                          onClick={() => updateComplaintStatus(cmp.id, { status: "Resolved" })}
                          className="flex items-center gap-1 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] px-3.5 py-2 text-xs font-bold text-white shadow-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Assign Technician to Complaint */}
      {assigningComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Car className="h-5 w-5 text-[#2563EB]" /> Assign Technician to Complaint
              </h3>
              <button
                onClick={() => setAssigningComplaint(null)}
                className="rounded-lg p-1 text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignComplaintSubmit} className="space-y-3 text-xs">
              <div className="rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-3 text-[#0F172A]">
                <strong>{assigningComplaint.customerName}</strong> ({assigningComplaint.customerMobile})<br />
                Issue: {assigningComplaint.category} – {assigningComplaint.issueType}
              </div>

              <div>
                <label className="block font-bold text-[#64748B] mb-1">Technician Full Name</label>
                <input
                  type="text"
                  required
                  value={cmpTechName}
                  onChange={(e) => setCmpTechName(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#64748B] mb-1">
                  Technician Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={cmpTechPhone}
                  onChange={(e) => setCmpTechPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#64748B] mb-1">Expected Arrival Time</label>
                <input
                  type="text"
                  required
                  value={cmpExpectedArrival}
                  onChange={(e) => setCmpExpectedArrival(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningComplaint(null)}
                  className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Assign Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Product */}
      {schedulingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[#2563EB]" /> Schedule Technician
              </h3>
              <button
                onClick={() => setSchedulingReq(null)}
                className="rounded-lg p-1 text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div className="rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-3 text-[#0F172A]">
                <strong>{schedulingReq.customerName}</strong> ({schedulingReq.customerMobile})<br />
                Service: {schedulingReq.productName}
              </div>

              <div>
                <label className="block font-bold text-[#64748B] mb-1">
                  Assign Technician Name
                </label>
                <input
                  type="text"
                  required
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#64748B] mb-1">Technician Mobile</label>
                <input
                  type="text"
                  required
                  value={techPhone}
                  onChange={(e) => setTechPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#64748B] mb-1">
                  Scheduled Date & Slot
                </label>
                <input
                  type="text"
                  required
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSchedulingReq(null)}
                  className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#2563EB]" /> Edit Product / Service Details
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="rounded-lg p-1 text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductUpdate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#64748B] mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editNameVal}
                  onChange={(e) => setEditNameVal(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#64748B] mb-1">Category</label>
                <select
                  value={editCategoryVal}
                  onChange={(e) => setEditCategoryVal(e.target.value as "accessory" | "service")}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                >
                  <option value="accessory">📦 Accessory</option>
                  <option value="service">🔧 Installation Service</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#64748B] mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editPriceVal}
                    onChange={(e) => setEditPriceVal(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#64748B] mb-1">Available Stock</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editStockVal}
                    onChange={(e) => setEditStockVal(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#64748B] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescVal}
                  onChange={(e) => setEditDescVal(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(editingProduct.id, editingProduct.name)}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" /> Delete Item
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#0F172A]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Product */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#2563EB]" /> Add New Inventory Product
              </h3>
              <button
                onClick={() => setShowAddProduct(false)}
                className="rounded-lg p-1 text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#64748B] mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optical HDMI Cable"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#64748B] mb-1">Category</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value as "accessory" | "service")}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                >
                  <option value="accessory">📦 Accessory</option>
                  <option value="service">🔧 Installation Service</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#64748B] mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#64748B] mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#64748B] mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Map / Add New STB ID */}
      {showAddStbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Tv className="h-5 w-5 text-[#2563EB]" /> Map / Add New STB ID
              </h3>
              <button
                onClick={() => {
                  setShowAddStbModal(false);
                  setStbErr(null);
                }}
                className="rounded-lg p-1 text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {stbErr && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
                ⚠️ {stbErr}
              </div>
            )}

            <form onSubmit={handleAddStbSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">
                  STB ID / Box ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={12}
                  required
                  autoFocus
                  placeholder="e.g. STB123456789"
                  value={newStbId}
                  onChange={(e) => setNewStbId(e.target.value.toUpperCase().slice(0, 12))}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-base font-mono font-extrabold text-[#0F172A] tracking-wider outline-none focus:border-[#2563EB]"
                />
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] font-medium">🔤 Letters & Numbers allowed (Max 12 chars)</span>
                  <span
                    className={`font-mono font-bold ${
                      newStbId.length > 0 ? "text-[#22C55E]" : "text-[#2563EB]"
                    }`}
                  >
                    {newStbId.length} / 12 chars
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#CBD5E1]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStbModal(false);
                    setStbErr(null);
                  }}
                  className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-xs font-bold text-[#0F172A] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stbSubmitting || !newStbId.trim()}
                  className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {stbSubmitting ? "Mapping..." : "Map STB ID"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperatorPage;
