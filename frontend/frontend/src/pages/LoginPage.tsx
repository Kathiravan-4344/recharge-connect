import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Tv, Shield, Zap, ArrowRight, Lock } from "lucide-react";
import { sendOtp, verifyOtp, useStore, isOperatorApproved, getState, syncOperatorsFromBackend } from "../services/store";
import { apiValidateStb } from "../services/api";
import { cleanMobile } from "../utils/utils";

function getRoleFromUrl(): "customer" | "operator" {
  if (typeof window === "undefined") return "customer";
  const fullPath = window.location.hash || window.location.search || "";
  const queryStr = fullPath.includes("?") ? fullPath.substring(fullPath.indexOf("?") + 1) : "";
  const params = new URLSearchParams(queryStr);
  const r = params.get("role");
  if (r === "operator") return "operator";
  return "customer";
}

export function LoginPage() {
  const search = useSearch({ strict: false }) as { role?: string };
  const [role, setRole] = useState<"customer" | "operator">(getRoleFromUrl);
  const [step, setStep] = useState<"details" | "otp">("details");

  // Common & Customer state
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [stbId, setStbId] = useState("");

  // Operator state: Contact can be Mobile Number OR Gmail
  const [operatorContact, setOperatorContact] = useState("");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const navigate = useNavigate();
  const user = useStore((s) => s.user);

  useEffect(() => {
    const r = search?.role || getRoleFromUrl();
    if (r === "operator" || r === "customer") {
      setRole(r);
    }
  }, [search]);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate({ to: "/admin" });
      } else if (user.role === "operator") {
        navigate({ to: "/operator" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, navigate]);

  function handleSwitchRole(newRole: "customer" | "operator") {
    setRole(newRole);
    setStep("details");
    setErr(null);
  }

  // Formatting Operator Contact: Auto-lowercase for email/text, clean digits for mobile
  function handleOperatorContactChange(raw: string) {
    setErr(null);
    if (raw.includes("@")) {
      setOperatorContact(raw.toLowerCase().trim());
    } else {
      const digits = raw.replace(/[^\d+ ]/g, "");
      setOperatorContact(digits);
    }
  }

  // Real-time validation checks
  const cleanedOpContact = cleanMobile(operatorContact);
  const isOperatorEmail = operatorContact.includes("@");
  const isOperatorValidEmail =
    isOperatorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(operatorContact.trim());
  const isOperatorValidMobile = !isOperatorEmail && /^\d{10}$/.test(cleanedOpContact);

  const isOperatorValid =
    name.trim().length > 0 &&
    (isOperatorValidEmail || isOperatorValidMobile || cleanedOpContact === "9080864542" || cleanedOpContact === "9787312758");

  const isCustomerValid =
    name.trim().length > 0 &&
    /^\d{10}$/.test(cleanMobile(mobile)) &&
    /^[A-Za-z0-9\-\_]{4,12}$/.test(stbId.trim());

  const isFormValid = role === "operator" ? isOperatorValid : isCustomerValid;

  async function handleSend() {
    setErr(null);
    if (!name.trim()) {
      setErr("ENTER YOUR NAME");
      return;
    }

    if (role === "operator") {
      const contact = operatorContact.trim();
      const cleanedContact = cleanMobile(contact);

      if (!contact) {
        setErr("ENTER YOUR MOBILE NUMBER OR GMAIL");
        return;
      }

      // Check if Admin login number 9080864542
      if (cleanedContact === "9080864542") {
        setLoading(true);
        await sendOtp("9080864542");
        setLoading(false);
        setStep("otp");
        return;
      }

      // STRICT OPERATOR WHITELIST CHECK FOR OTHERS
      setLoading(true);
      await syncOperatorsFromBackend();
      setLoading(false);

      if (!isOperatorApproved(contact) && !isOperatorApproved(cleanedContact)) {
        setErr(
          "❌ You are not authorized. Contact Admin (KATHIRAVAN V) to add your operator number.",
        );
        return;
      }

      if (!isOperatorValidEmail && !isOperatorValidMobile) {
        if (isOperatorEmail) {
          setErr("Please enter a valid Gmail / Email address");
        } else {
          setErr("Please enter a valid 10-digit Mobile Number");
        }
        return;
      }

      setLoading(true);
      await sendOtp(cleanedContact || contact);
      setLoading(false);
      setStep("otp");
    } else {
      const cleanedMobile = mobile.trim().replace(/\D/g, "");

      if (cleanedMobile === "9080864542") {
        setErr("❌ Admin Portal can ONLY be accessed via Operator Login tab.");
        return;
      }

      if (!/^\d{10}$/.test(mobile)) {
        setErr("Enter a valid 10-digit mobile number");
        return;
      }

      if (!/^[A-Za-z0-9\-\_]{4,12}$/.test(stbId.trim())) {
        setErr("Enter a valid STB ID / Customer ID (4 to 12 characters)");
        return;
      }

      setLoading(true);

      // Validate STB ID against Operator mapped STB IDs
      const valRes = await apiValidateStb(stbId.trim());
      if (!valRes.success || !valRes.data?.valid) {
        setLoading(false);
        setErr(
          valRes.data?.message ||
            "❌ STB ID is not registered with any operator. Please contact your local operator to map your STB ID."
        );
        return;
      }

      await sendOtp(mobile);
      setLoading(false);
      setStep("otp");
    }
  }

  async function handleVerify() {
    setErr(null);
    if (otp.length !== 4) {
      setErr("Enter the 4-digit OTP");
      return;
    }
    setLoading(true);

    if (role === "operator") {
      const contact = operatorContact.trim();
      const cleanedContact = contact.replace(/\D/g, "");

      // ADMIN PORTAL LOGIN (ONLY VIA OPERATOR LOGIN TAB)
      if (cleanedContact === "9080864542") {
        const ok = await verifyOtp("9080864542", otp, name || "KATHIRAVAN V", "admin");
        setLoading(false);
        if (ok) {
          navigate({ to: "/admin" });
        } else {
          setErr("Incorrect OTP code. Enter 4-digit OTP.");
        }
        return;
      }

      // OPERATOR LOGIN
      if (!isOperatorApproved(contact)) {
        setLoading(false);
        setErr("❌ You are not authorized. Contact Admin (KATHIRAVAN V) to add your operator number.");
        return;
      }
      const isGmail = contact.includes("@");
      const mobileNum = isGmail ? "9787312758" : contact;
      const emailAddr = isGmail ? contact : undefined;
      const operatorNum = isGmail
        ? "OP-" + contact.split("@")[0].toUpperCase()
        : "OP-" + contact.slice(-5);

      const ok = await verifyOtp(mobileNum, otp, name, "operator", {
        email: emailAddr,
        operatorNumber: operatorNum,
      });
      setLoading(false);

      if (ok) {
        const currentUser = getState().user;
        if (currentUser?.role === "admin") {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/operator" });
        }
      } else {
        setErr("Incorrect code. Your 6-digit code is set on first login — use the same one each time.");
      }
    } else {
      const cleanedMobile = mobile.trim().replace(/\D/g, "");

      // BLOCK ADMIN NUMBER ON CUSTOMER LOGIN
      if (cleanedMobile === "9080864542") {
        setLoading(false);
        setErr("❌ Admin Portal can ONLY be accessed via Operator Login tab.");
        return;
      }

      const ok = await verifyOtp(mobile, otp, name, "customer", {
        stbId: stbId.trim() || "1234567890",
      });
      setLoading(false);

      if (ok) {
        navigate({ to: "/dashboard" });
      } else {
        setErr("Incorrect code. Your 6-digit code is set on first login — use the same one each time.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-[#0F172A]">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-center">
        {/* LEFT SIDE BRAND PANEL */}
        <div className="bg-gradient-to-b from-[#2563EB] to-[#1E3A8A] text-white rounded-3xl p-8 lg:p-10 flex flex-col justify-between min-h-[440px] md:min-h-[500px] shadow-xl shadow-blue-950/10 border border-blue-500/20">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-sm">
                <Tv className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight block">STB RECHARGE</span>
                <span className="text-xs text-blue-100/80 font-medium tracking-wide uppercase">
                  Recharge your Set Top Box easily
                </span>
              </div>
            </div>

            <div className="mt-10 lg:mt-12 space-y-3">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                {role === "operator" ? (
                  <>Operator Control Portal</>
                ) : (
                  <>Recharge your Set Top Box easily</>
                )}
              </h1>
              <p className="text-blue-100/90 text-sm leading-relaxed max-w-md">
                {role === "operator"
                  ? "Manage customer subscriptions, review instant approvals, and oversee cable TV operator operations smoothly."
                  : "Enjoy instant set top box top-ups, live operator verification, and round-the-clock service reliability."}
              </p>
            </div>
          </div>

          {/* Feature List (3 Items) */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: "Instant Pay" },
              { icon: Shield, label: "Operator Verified" },
              { icon: Lock, label: "Secure System" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-1.5 transition hover:bg-white/15"
              >
                <Icon className="h-5 w-5 text-blue-200" />
                <span className="text-[11px] font-semibold text-white/95 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE LOGIN CARD */}
        <div className="bg-white rounded-[16px] shadow-xl shadow-slate-200/70 border border-[#CBD5E1] p-6 sm:p-8 lg:p-10">
          {/* TAB DESIGN (Toggle Tabs) */}
          <div className="mb-6 bg-[#F1F5F9] p-1.5 rounded-xl flex gap-1.5 border border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => handleSwitchRole("customer")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out ${
                role === "customer"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <Tv className="h-4 w-4" />
              Customer Login
            </button>
            <button
              type="button"
              onClick={() => handleSwitchRole("operator")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out ${
                role === "operator"
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                  : "bg-[#E2E8F0] text-[#334155] hover:bg-slate-300/70 hover:text-[#0F172A]"
              }`}
            >
              <Shield className="h-4 w-4" />
              Operator Login
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
              {step === "details"
                ? role === "operator"
                  ? "Operator Login"
                  : "Customer Login"
                : "Verify OTP"}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              {step === "details"
                ? role === "operator"
                  ? "Enter registered operator mobile number or Gmail"
                  : "Enter your mobile number and STB ID to proceed"
                : `We sent a 4-digit verification OTP code to ${
                    role === "operator" ? operatorContact : "+91 " + mobile
                  }`}
            </p>
          </div>

          {step === "details" ? (
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value.toUpperCase());
                    setErr(null);
                  }}
                  placeholder="ENTER YOUR NAME"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 uppercase font-bold"
                />
              </div>

              {role === "operator" ? (
                /* Operator Contact Field */
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                    Mobile Number or Gmail
                  </label>
                  <input
                    value={operatorContact}
                    onChange={(e) => handleOperatorContactChange(e.target.value)}
                    placeholder="ENTER OPERATOR MOBILE NUMBER OR GMAIL"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15"
                  />
                </div>
              ) : (
                /* Customer Fields */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                      Mobile Number
                    </label>
                    <div className="flex bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] overflow-hidden focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-[#2563EB]/15 transition">
                      <span className="flex items-center px-4 bg-slate-100 text-xs font-bold text-[#64748B] border-r border-[#CBD5E1]">
                        +91
                      </span>
                      <input
                        inputMode="numeric"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => {
                          setMobile(e.target.value.replace(/\D/g, ""));
                          setErr(null);
                        }}
                        placeholder="ENTER YOUR MOBILE NUMBER"
                        className="w-full bg-transparent px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                        STB ID / Smart Card Number *
                      </label>
                      <span
                        className={`text-xs font-mono font-bold ${
                          stbId.length >= 4 ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {stbId.length}/12
                      </span>
                    </div>
                    <input
                      inputMode="text"
                      maxLength={12}
                      value={stbId}
                      onChange={(e) => {
                        setStbId(e.target.value.replace(/[^A-Za-z0-9\-_]/g, "").toUpperCase());
                        setErr(null);
                      }}
                      placeholder="ENTER STB ID / SMART CARD NUMBER"
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] px-4 py-3 text-sm text-[#0F172A] font-mono font-semibold placeholder:font-sans placeholder:font-normal placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15"
                    />
                    {stbId.length > 0 && stbId.length < 4 && (
                      <p className="mt-1.5 text-xs text-amber-700 font-medium flex items-center gap-1">
                        ⚠️ Enter at least {4 - stbId.length} more character(s) to unlock OTP verification.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {err && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {err}
                </div>
              )}

              {/* Primary Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !isFormValid}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[12px] py-3.5 px-4 text-base shadow-md shadow-blue-500/20 transition-all duration-200 ease-in-out flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99]"
              >
                {loading ? (
                  "Sending Verification OTP…"
                ) : (
                  <>
                    Send OTP <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-[#64748B]">
                By continuing you agree to our Terms & Operator Authorization Policy.
              </p>
            </div>
          ) : (
            /* OTP Step */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2 text-center">
                  Enter 4-Digit Verification OTP
                </label>
                <input
                  autoFocus
                  inputMode="numeric"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] py-3.5 text-center text-3xl font-bold tracking-[0.5em] text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15"
                />
              </div>

              {err && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
                  {err}
                </div>
              )}

              <button
                type="button"
                onClick={handleVerify}
                disabled={loading || otp.length !== 4}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[12px] py-3.5 px-4 text-base shadow-md shadow-blue-500/20 transition-all duration-200 ease-in-out flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99]"
              >
                {loading
                  ? "Verifying OTP…"
                  : role === "operator"
                    ? "Verify OTP & Open Operator Panel"
                    : "Verify & Continue"}
              </button>

              <button
                type="button"
                onClick={() => setStep("details")}
                className="w-full text-center text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition"
              >
                ← Back to details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
