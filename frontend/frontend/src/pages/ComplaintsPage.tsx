import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  useStore,
  fileComplaint,
  rateComplaint,
  type Complaint,
  type ComplaintStatus,
} from "../services/store";
import {
  Wrench,
  Tv,
  Radio,
  Cable,
  CreditCard,
  CheckCircle2,
  Car,
  Phone,
  Star,
  Upload,
  Send,
  X,
  Sparkles,
  History,
} from "lucide-react";

const CATEGORY_ISSUES: Record<
  string,
  { label: string; icon: React.ElementType; issues: string[] }
> = {
  "TV Issues": {
    label: "📺 TV Issues",
    icon: Tv,
    issues: ["No Signal", "Channel Not Showing", "Picture Problem", "Audio Problem"],
  },
  "STB Issues": {
    label: "📡 STB Issues",
    icon: Radio,
    issues: [
      "STB Not Working",
      "STB Power Problem",
      "Remote Not Working",
      "STB Error Message",
      "Box Replacement Request",
    ],
  },
  "Cable Connection Issues": {
    label: "🔌 Cable Connection Issues",
    icon: Cable,
    issues: ["Cable Cut", "Poor Signal", "Connection Problem"],
  },
  "Recharge Issues": {
    label: "💳 Recharge Issues",
    icon: CreditCard,
    issues: ["Recharge Not Updated", "Payment Completed but Not Activated", "Plan Issue"],
  },
};

function StatusBadge({ status }: { status: ComplaintStatus }) {
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

export function ComplaintsPage() {
  const user = useStore((s) => s.user);
  const stb = useStore((s) => s.stb);
  const complaints = useStore((s) => s.complaints);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  // Tab: "raise" | "tracking" | "history"
  const [activeTab, setActiveTab] = useState<"raise" | "tracking" | "history">("raise");

  // Form State
  const [stbIdInput, setStbIdInput] = useState<string>(stb?.id ?? "1234567890");
  const [nameInput, setNameInput] = useState<string>(user?.name || stb?.customerName || "");
  const [mobileInput, setMobileInput] = useState<string>(user?.mobile || "9876543210");

  const [selectedCategory, setSelectedCategory] = useState<string>("TV Issues");
  const [selectedIssueType, setSelectedIssueType] = useState<string>("No Signal");
  const [description, setDescription] = useState<string>("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [preferredTime, setPreferredTime] = useState<string>("Immediate Emergency");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Rating Modal State
  const [ratingComplaint, setRatingComplaint] = useState<Complaint | null>(null);
  const [starVal, setStarVal] = useState<number>(5);
  const [feedbackVal, setFeedbackVal] = useState<string>("");

  const userComplaints = complaints.filter(
    (c) =>
      (user?.mobile && c.customerMobile === user.mobile) ||
      (stb?.id && c.stbId === stb.id) ||
      c.customerMobile === mobileInput,
  );

  const activeTrackingComplaints = userComplaints.filter((c) => c.status !== "Resolved");
  const resolvedComplaints = userComplaints.filter((c) => c.status === "Resolved");

  function handleCategoryChange(cat: string) {
    setSelectedCategory(cat);
    const available = CATEGORY_ISSUES[cat]?.issues || [];
    if (available.length > 0) {
      setSelectedIssueType(available[0]);
    }
  }

  function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stbIdInput.trim() || !nameInput.trim() || !mobileInput.trim()) {
      alert("Please fill in required fields.");
      return;
    }

    fileComplaint({
      category: selectedCategory,
      issueType: selectedIssueType,
      description: description.trim(),
      mediaUrl: mediaPreview || undefined,
      preferredTime,
      stbId: stbIdInput.trim(),
      customerName: nameInput.trim(),
      customerMobile: mobileInput.trim(),
    });

    setSuccessMsg(`Complaint submitted successfully! Operator notified.`);
    setDescription("");
    setMediaPreview(null);

    setTimeout(() => {
      setActiveTab("tracking");
    }, 1200);
  }

  function handleSaveRating(e: React.FormEvent) {
    e.preventDefault();
    if (!ratingComplaint) return;
    rateComplaint(ratingComplaint.id, starVal, feedbackVal.trim());
    setRatingComplaint(null);
    setFeedbackVal("");
    alert("Thank you for your rating & feedback!");
  }

  return (
    <AppShell>
      {/* Top Banner Header */}
      <section className="bg-white rounded-2xl border border-[#CBD5E1] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-bold text-[#2563EB]">
              <Wrench className="h-3.5 w-3.5 text-[#2563EB]" /> Service & Complaints
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              🛠️ Raise Service Complaint
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-[#64748B] max-w-xl">
              Report signal issues, STB power errors, cable cut, or recharge status.
            </p>
          </div>

          {/* GLOBAL TAB FIX (Inactive #E2E8F0 / Active #2563EB) */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] p-1.5 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("raise")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out ${
                activeTab === "raise"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <Wrench className="h-4 w-4" /> Raise Complaint
            </button>
            <button
              onClick={() => setActiveTab("tracking")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out ${
                activeTab === "tracking"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <Car className="h-4 w-4" /> Tracking ({activeTrackingComplaints.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out ${
                activeTab === "history"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <History className="h-4 w-4" /> History ({resolvedComplaints.length})
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

      {/* TAB 1: Raise Complaint Form */}
      {activeTab === "raise" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Category & Issue Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#2563EB]" /> Select Issue Category & Issue Type
            </h2>

            {/* 4 Category selector cards */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(CATEGORY_ISSUES).map(([catKey, catObj]) => {
                const IconComp = catObj.icon;
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => handleCategoryChange(catKey)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-[#2563EB] bg-blue-50/70 shadow-sm"
                        : "border-[#CBD5E1] bg-white hover:border-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`rounded-xl p-2 font-bold ${isSelected ? "bg-[#2563EB] text-white" : "bg-slate-100 text-[#64748B]"}`}>
                        <IconComp className="h-5 w-5" />
                      </span>
                      {isSelected && (
                        <span className="text-xs font-bold text-[#2563EB]">Selected ✓</span>
                      )}
                    </div>
                    <div className="mt-3 font-bold text-base text-[#0F172A]">
                      {catObj.label}
                    </div>
                    <span className="text-xs text-[#64748B] font-semibold">
                      {catObj.issues.length} Issue Types
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Issue Types selection pills */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-[#0F172A]">
                Specific {selectedCategory} Issue:
              </h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ISSUES[selectedCategory]?.issues.map((issue) => {
                  const isChosen = selectedIssueType === issue;
                  return (
                    <button
                      key={issue}
                      type="button"
                      onClick={() => setSelectedIssueType(issue)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                        isChosen
                          ? "bg-[#2563EB] text-white shadow-sm"
                          : "border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] hover:bg-slate-100"
                      }`}
                    >
                      {issue}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Simple White Card Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm space-y-4">
              <div className="border-b border-[#CBD5E1] pb-3">
                <h3 className="text-xl font-bold text-[#0F172A]">
                  📝 Complaint Details
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Submit to local operator for technician visit
                </p>
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

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[#0F172A]">
                  <div className="text-[10px] uppercase font-bold text-[#2563EB]">
                    Selected Issue
                  </div>
                  <strong className="text-sm block mt-0.5 font-bold">
                    {selectedCategory} → {selectedIssueType}
                  </strong>
                </div>

                {/* Dropdown / Preferred Time */}
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#64748B] mb-1">
                    Preferred Visit Slot
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-xs sm:text-sm text-[#0F172A] font-semibold outline-none focus:border-[#2563EB]"
                  >
                    <option value="Immediate Emergency">⚡ Immediate Emergency (Fastest)</option>
                    <option value="Morning (9 AM - 12 PM)">🌅 Morning (9 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 4 PM)">☀️ Afternoon (12 PM - 4 PM)</option>
                    <option value="Evening (4 PM - 7 PM)">🌆 Evening (4 PM - 7 PM)</option>
                  </select>
                </div>

                {/* Textarea */}
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#64748B] mb-1">
                    Complaint Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the issue details or TV screen error..."
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Blue Submit Button */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-3.5 text-base font-extrabold text-white shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-[0.99]"
                >
                  <Send className="h-5 w-5" /> Submit Complaint
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Live Tracking View */}
      {activeTab === "tracking" && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0F172A]">
              🔄 Active Complaint Tracking
            </h2>
          </div>

          {activeTrackingComplaints.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-12 text-center shadow-sm">
              <Wrench className="mx-auto h-12 w-12 text-[#64748B]" />
              <h3 className="mt-3 font-bold text-lg text-[#0F172A]">
                No active complaints in progress
              </h3>
              <p className="mt-1 text-xs text-[#64748B]">
                All your service complaints have been resolved!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {activeTrackingComplaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-[#CBD5E1] p-6 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-[#CBD5E1] pb-3">
                    <div>
                      <div className="text-xs font-mono font-bold text-[#2563EB]">
                        CMP ID: {c.id}
                      </div>
                      <h3 className="text-lg font-bold text-[#0F172A] mt-0.5">
                        {c.category} – {c.issueType}
                      </h3>
                      <div className="text-xs text-[#64748B]">
                        STB ID: {c.stbId} · Submitted {new Date(c.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  <div className="text-xs text-[#0F172A] bg-[#F8FAFC] p-3 rounded-xl border border-[#CBD5E1]">
                    <strong className="text-[#64748B]">Issue Notes: </strong> {c.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Service History */}
      {activeTab === "history" && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0F172A]">
              📜 Service History
            </h2>
          </div>

          {resolvedComplaints.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-12 text-center shadow-sm">
              <History className="mx-auto h-12 w-12 text-[#64748B]" />
              <h3 className="mt-3 font-bold text-lg text-[#0F172A]">
                No resolved history yet
              </h3>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {resolvedComplaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-[#CBD5E1] p-6 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[#CBD5E1] pb-3">
                    <div>
                      <div className="text-xs font-mono font-bold text-[#22C55E]">
                        CMP ID: {c.id}
                      </div>
                      <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                        {c.category} – {c.issueType}
                      </h3>
                    </div>
                    <StatusBadge status={c.status} />
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

export default ComplaintsPage;
