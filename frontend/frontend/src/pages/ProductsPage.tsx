import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  useStore,
  requestProduct,
  type ProductRequestStatus,
} from "../services/store";
import {
  Package,
  Wrench,
  ShoppingBag,
  Tv,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Upload,
  Plus,
  Minus,
  Check,
  Send,
  X,
  User,
  Phone,
  Sparkles,
} from "lucide-react";

function StatusBadge({ status }: { status: ProductRequestStatus }) {
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
          <AlertCircle className="h-3.5 w-3.5" /> 🔴 Not Available
        </span>
      );
    default:
      return null;
  }
}

export function ProductsPage() {
  const user = useStore((s) => s.user);
  const stb = useStore((s) => s.stb);
  const products = useStore((s) => s.products);
  const productRequests = useStore((s) => s.productRequests);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  // Tab: "request" or "my_requests"
  const [activeTab, setActiveTab] = useState<"request" | "my_requests">("request");

  // Category filter for form: "all" | "accessory" | "service"
  const [categoryFilter, setCategoryFilter] = useState<"all" | "accessory" | "service">("all");

  // Selection
  const [selectedProductId, setSelectedProductId] = useState<string>("prod-1");
  const [quantity, setQuantity] = useState<number>(1);
  const [stbIdInput, setStbIdInput] = useState<string>(stb?.id ?? "1234567890");
  const [nameInput, setNameInput] = useState<string>(user?.name || stb?.customerName || "");
  const [mobileInput, setMobileInput] = useState<string>(user?.mobile || "9876543210");
  const [description, setDescription] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  useEffect(() => {
    if (!selectedProduct && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProduct]);

  const unitPrice = selectedProduct?.price ?? 0;
  const totalPrice = unitPrice * quantity;

  const filteredProducts = products.filter((p) => {
    if (categoryFilter === "all") return true;
    return p.category === categoryFilter;
  });

  const userRequests = productRequests.filter(
    (r) =>
      (user?.mobile && r.customerMobile === user.mobile) ||
      (stb?.id && r.stbId === stb.id) ||
      r.customerMobile === mobileInput,
  );

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!stbIdInput.trim()) {
      alert("Please enter a valid STB ID");
      return;
    }

    if (!nameInput.trim()) {
      alert("Please enter Customer Name");
      return;
    }

    if (!mobileInput.trim() || mobileInput.trim().length < 10) {
      alert("Please enter a valid Mobile Number");
      return;
    }

    requestProduct({
      productId: selectedProduct.id,
      quantity,
      description: description.trim(),
      imageUrl: imagePreview || undefined,
      stbId: stbIdInput.trim(),
      customerName: nameInput.trim(),
      customerMobile: mobileInput.trim(),
    });

    setSuccessMsg(
      `Your request for "${selectedProduct.name}" has been sent to the operator successfully!`,
    );
    setDescription("");
    setImagePreview(null);
    setQuantity(1);

    setTimeout(() => {
      setActiveTab("my_requests");
    }, 1500);
  }

  return (
    <AppShell>
      {/* Top Banner Header */}
      <section className="bg-white rounded-2xl border border-[#CBD5E1] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-bold text-[#2563EB]">
              <ShoppingBag className="h-3.5 w-3.5 text-[#2563EB]" /> Accessories & Services
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              🛒 Products & Accessories
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-[#64748B] max-w-xl">
              Order replacement HDMI cables, STB remotes, adapters, or book technician setup.
            </p>
          </div>

          {/* GLOBAL TAB FIX */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] p-1.5 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("request")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out ${
                activeTab === "request"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <Package className="h-4 w-4" /> New Request
            </button>
            <button
              onClick={() => setActiveTab("my_requests")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out ${
                activeTab === "my_requests"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <Clock className="h-4 w-4" /> Track Status ({userRequests.length})
            </button>
          </div>
        </div>
      </section>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="h-5 w-5 text-[#22C55E] shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="p-1 hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {activeTab === "request" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Product Catalog Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#2563EB]" /> Choose Item or Service
              </h2>
              <div className="flex items-center gap-1 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`rounded-lg px-3 py-1 font-bold transition ${
                    categoryFilter === "all"
                      ? "bg-[#2563EB] text-white"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  All Items
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("accessory")}
                  className={`rounded-lg px-3 py-1 font-bold transition ${
                    categoryFilter === "accessory"
                      ? "bg-[#2563EB] text-white"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  📦 Accessories
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("service")}
                  className={`rounded-lg px-3 py-1 font-bold transition ${
                    categoryFilter === "service"
                      ? "bg-[#2563EB] text-white"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  🔧 Services
                </button>
              </div>
            </div>

            {/* Product Cards */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              {filteredProducts.length === 0 ? (
                <div className="sm:col-span-2 rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
                  <Package className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="font-bold text-[#0F172A] text-sm">No items available currently</p>
                  <p className="text-xs text-[#64748B] mt-1">
                    Your local cable operator has not published any stock items yet.
                  </p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProductId(p.id)}
                    className={`group relative text-left rounded-2xl border p-4 transition-all duration-200 bg-white shadow-sm ${
                      isSelected
                        ? "border-[#2563EB] bg-blue-50/70 shadow-md"
                        : "border-[#CBD5E1] hover:border-slate-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`rounded-xl p-2 font-bold ${isSelected ? "bg-[#2563EB] text-white" : "bg-slate-100 text-[#64748B]"}`}>
                        {p.category === "service" ? (
                          <Wrench className="h-5 w-5" />
                        ) : (
                          <Package className="h-5 w-5" />
                        )}
                      </span>
                      <div className="text-right">
                        <div className="text-xl font-extrabold text-[#2563EB]">₹{p.price}</div>
                        <span className="text-[10px] text-[#64748B] uppercase font-bold">
                          {p.category === "service" ? "Service Fee" : "Unit Price"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-base font-bold text-[#0F172A]">
                      {p.name}
                    </div>

                  </button>
                );
              })
              )}
            </div>
          </div>

          {/* Form Side (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm space-y-4">
              <div className="border-b border-[#CBD5E1] pb-3">
                <h3 className="text-xl font-bold text-[#0F172A]">
                  📝 Request Details
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#64748B] mb-1">
                    STB ID
                  </label>
                  <input
                    type="text"
                    required
                    value={stbIdInput}
                    onChange={(e) => setStbIdInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#64748B] mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#64748B] mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-1">
                  <div className="text-xs font-bold uppercase text-[#2563EB]">
                    Item: {selectedProduct?.name}
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-[#0F172A]">
                    <span>Total Amount:</span>
                    <span className="text-[#2563EB]">₹{totalPrice}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-3.5 text-base font-extrabold text-white shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-[0.99]"
                >
                  <Send className="h-5 w-5" /> Submit Request
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0F172A]">
              🔄 My Product Requests
            </h2>
          </div>

          {userRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-12 text-center shadow-sm">
              <Package className="mx-auto h-12 w-12 text-[#64748B]" />
              <h3 className="mt-3 font-bold text-lg text-[#0F172A]">No requests found</h3>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#CBD5E1] p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-[#CBD5E1] pb-3">
                    <div>
                      <div className="text-xs font-mono font-bold text-[#2563EB]">
                        REQ ID: {req.id}
                      </div>
                      <div className="text-lg font-bold text-[#0F172A] mt-0.5">
                        {req.productName}
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

export default ProductsPage;
