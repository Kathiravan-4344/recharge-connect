import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Tv, Shield, Zap, ArrowRight, Lock, RefreshCw, CheckCircle2 } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "../config/firebase";
import { sendOtp, verifyOtp, useStore, isOperatorApproved, getState, syncOperatorsFromBackend } from "../services/store";
import { apiValidateStb } from "../services/api";
import { cleanMobile, normalizeIndianPhoneNumber } from "../utils/utils";
import { VENKATESA_STB_MAPPINGS } from "../services/venkatesaStbs";

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
  
  // Step state:
  // For Customer: "details" (Name + STB ID + Mobile) -> "otp" (Firebase 6-digit SMS)
  // For Operator: "details" -> "otp"
  const [step, setStep] = useState<"details" | "otp">("details");

  // Common & Customer state
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [stbId, setStbId] = useState("");

  // Operator state
  const [operatorContact, setOperatorContact] = useState("");

  // OTP state
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Firebase Auth State
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [firebaseUid, setFirebaseUid] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);

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

  // Resend Timer Effect
  useEffect(() => {
    let timer: any = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  function handleSwitchRole(newRole: "customer" | "operator") {
    setRole(newRole);
    setStep("details");
    setErr(null);
    setOtp("");
    setConfirmationResult(null);
  }

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
    stbId.trim().length >= 4 &&
    /^\d{10}$/.test(cleanMobile(mobile));

  // Initialize invisible Firebase reCAPTCHA
  function setupRecaptcha() {
    if (typeof window === "undefined") return null;
    try {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
      }
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          setErr("reCAPTCHA expired. Please try requesting OTP again.");
        },
      });
      (window as any).recaptchaVerifier = verifier;
      return verifier;
    } catch (err: any) {
      console.error("Recaptcha Setup Error:", err);
      return null;
    }
  }

  // Customer Step 1: Validate STB ID against Operator & Send SMS OTP
  async function handleSendCustomerOtp() {
    setErr(null);
    const cleanStb = stbId.trim().toUpperCase();
    if (!cleanStb || !/^[A-Za-z0-9\-\_]{4,12}$/.test(cleanStb)) {
      setErr("ENTER YOUR STB ID (4 to 12 characters)");
      return;
    }

    const phoneResult = normalizeIndianPhoneNumber(mobile);
    if (!phoneResult.valid) {
      setErr(`❌ ${phoneResult.error || "Please enter a valid 10-digit mobile number."}`);
      return;
    }

    const cleanedMobile = cleanMobile(mobile);

    if (cleanedMobile === "9080864542") {
      setErr("❌ Admin Portal can ONLY be accessed via Operator Login tab.");
      return;
    }

    setLoading(true);

    // 1. Validate STB ID against Operator Mapped STBs FIRST
    let isStbValid = false;
    let STBErrorMessage = "";

    try {
      const valRes = await apiValidateStb(cleanStb);
      if (valRes.success && valRes.data?.valid) {
        isStbValid = true;
        if (valRes.data.customerName && valRes.data.customerName !== "STB Subscriber" && !name.trim()) {
          setName(valRes.data.customerName.toUpperCase());
        }
      } else {
        STBErrorMessage = valRes.data?.message || valRes.message || "";
      }
    } catch (e: any) {
      console.warn("Backend STB validation network error, checking local store...", e);
    }

    // Fallback to local store / VENKATESA STB mappings if API call didn't return valid true
    if (!isStbValid) {
      const localMappings = getState().stbMappings || VENKATESA_STB_MAPPINGS || [];
      const match = localMappings.find(
        (m) => m.stbId && m.stbId.trim().toUpperCase() === cleanStb
      );
      if (match) {
        isStbValid = true;
      }
    }

    if (!isStbValid) {
      setLoading(false);
      setErr(
        STBErrorMessage ||
          "❌ STB ID is not registered with any operator. Please contact your local operator to map your STB ID."
      );
      return;
    }

    // 2. STB ID is valid and mapped -> Send Firebase Phone SMS OTP
    try {
      const verifier = setupRecaptcha();
      if (!verifier) {
        setErr("Failed to initialize reCAPTCHA. Please refresh the page.");
        setLoading(false);
        return;
      }

      const confirmation = await signInWithPhoneNumber(auth, phoneResult.formatted, verifier);
      setConfirmationResult(confirmation);
      setResendCooldown(30);
      setStep("otp");
    } catch (error: any) {
      console.error("Firebase Phone Auth Error:", error);
      let msg = "Failed to send SMS OTP. Please check mobile number and try again.";
      if (
        error.code === "auth/api-key-not-valid" ||
        (error.message && error.message.includes("api-key-not-valid"))
      ) {
        msg = "Firebase API Key is invalid or missing in Vercel settings / .env. Please configure VITE_FIREBASE_API_KEY with your valid Firebase Web App key.";
      } else if (error.code === "auth/invalid-phone-number") {
        msg = "Invalid mobile number format.";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Too many OTP requests. Please wait a few minutes before trying again.";
      } else if (error.code === "auth/captcha-check-failed") {
        msg = "reCAPTCHA verification failed. Please try again.";
      } else if (error.message) {
        msg = error.message;
      }
      setErr(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  // Operator Step 1: Send OTP
  async function handleSendOperatorOtp() {
    setErr(null);
    if (!name.trim()) {
      setErr("ENTER YOUR NAME");
      return;
    }

    const contact = operatorContact.trim();
    const cleanedContact = cleanMobile(contact);

    if (!contact) {
      setErr("ENTER YOUR MOBILE NUMBER OR GMAIL");
      return;
    }

    if (cleanedContact === "9080864542") {
      setLoading(true);
      await sendOtp("9080864542");
      setLoading(false);
      setStep("otp");
      return;
    }

    setLoading(true);
    await syncOperatorsFromBackend();
    setLoading(false);

    if (!isOperatorApproved(contact) && !isOperatorApproved(cleanedContact)) {
      setErr(
        "❌ You are not authorized. Contact Admin (KATHIRAVAN V) to add your operator number."
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
  }

  // Customer Step 2: Verify Firebase SMS OTP and open Customer Dashboard
  async function handleVerifyCustomerOtp() {
    setErr(null);
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setErr("Enter the 6-digit SMS OTP code");
      return;
    }

    if (!confirmationResult) {
      setErr("OTP session expired. Please request a new OTP.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await confirmationResult.confirm(cleanOtp);
      const uid = userCredential.user.uid;
      setFirebaseUid(uid);

      const cleanStb = stbId.trim().toUpperCase();
      const customerName = name.trim() || "STB Subscriber";
      const ok = await verifyOtp(mobile, "000000", customerName, "customer", {
        stbId: cleanStb,
        firebaseUid: uid,
      });

      setLoading(false);

      if (ok) {
        navigate({ to: "/dashboard" });
      } else {
        setErr("Failed to start customer session. Please try again.");
      }
    } catch (error: any) {
      console.error("Firebase OTP Verification Error:", error);
      let msg = "Incorrect OTP code.";
      if (error.code === "auth/invalid-verification-code") {
        msg = "Incorrect SMS OTP code. Please check and re-enter.";
      } else if (error.code === "auth/code-expired") {
        msg = "OTP has expired. Please click Resend OTP.";
      } else if (error.message) {
        msg = error.message;
      }
      setErr(`❌ ${msg}`);
      setLoading(false);
    }
  }

  // Operator Step 2: Verify OTP
  async function handleVerifyOperatorOtp() {
    setErr(null);
    if (otp.length !== 6) {
      setErr("Enter the 6-digit verification OTP code");
      return;
    }
    setLoading(true);

    const contact = operatorContact.trim();
    const cleanedContact = contact.replace(/\D/g, "");

    // ADMIN PORTAL LOGIN
    if (cleanedContact === "9080864542") {
      const ok = await verifyOtp("9080864542", otp, name || "KATHIRAVAN V", "admin");
      setLoading(false);
      if (ok) {
        navigate({ to: "/admin" });
      } else {
        setErr("Incorrect OTP code. Enter 6-digit OTP.");
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
      setErr("Incorrect code. Enter 6-digit OTP.");
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-[#0F172A]">
      {/* Container for Firebase Invisible reCAPTCHA */}
      <div id="recaptcha-container"></div>

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
                  : "Secure mobile login with instant operator verification and 24/7 reliability."}
              </p>
            </div>
          </div>

          {/* Feature List (3 Items) */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: "Instant Pay" },
              { icon: Shield, label: "Operator Verified" },
              { icon: Lock, label: "SMS Authentication" },
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
                : "Verify Mobile OTP"}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              {step === "details"
                ? role === "operator"
                  ? "Enter registered operator mobile number or Gmail"
                  : "Enter STB ID and mobile number to receive SMS OTP"
                : `Enter the 6-digit SMS OTP sent to ${
                    role === "operator" ? operatorContact : "+91 " + mobile
                  }`}
            </p>
          </div>

          {/* STEP 1: DETAILS */}
          {step === "details" && (
            <div className="space-y-4">
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

              {role === "customer" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                      STB ID / Smart Card Number
                    </label>
                    {stbId.length > 0 && (
                      <span
                        className={`text-xs font-mono font-bold ${
                          stbId.length >= 4 ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {stbId.length}/12
                      </span>
                    )}
                  </div>
                  <input
                    inputMode="text"
                    maxLength={12}
                    value={stbId}
                    onChange={(e) => {
                      setStbId(e.target.value.replace(/[^A-Za-z0-9\-_]/g, "").toUpperCase());
                      setErr(null);
                    }}
                    placeholder="ENTER YOUR STB ID"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] px-4 py-3 text-sm text-[#0F172A] font-mono font-semibold placeholder:font-sans placeholder:font-normal placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 uppercase"
                  />
                </div>
              )}

              {role === "operator" ? (
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
              )}

              {err && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {err}
                </div>
              )}

              <button
                type="button"
                onClick={role === "operator" ? handleSendOperatorOtp : handleSendCustomerOtp}
                disabled={loading || (role === "operator" ? !isOperatorValid : !isCustomerValid)}
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
            </div>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === "otp" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2 text-center">
                  Enter 6-Digit Verification OTP
                </label>
                <input
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setErr(null);
                  }}
                  placeholder="••••••"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] py-3.5 text-center text-3xl font-bold tracking-[0.4em] text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 font-mono"
                />
              </div>

              {err && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
                  {err}
                </div>
              )}

              <button
                type="button"
                onClick={role === "operator" ? handleVerifyOperatorOtp : handleVerifyCustomerOtp}
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[12px] py-3.5 px-4 text-base shadow-md shadow-blue-500/20 transition-all duration-200 ease-in-out flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99]"
              >
                {loading
                  ? "Verifying OTP…"
                  : role === "operator"
                  ? "Verify OTP & Open Operator Panel"
                  : "Verify OTP & Open Dashboard"}
              </button>

              {role === "customer" && (
                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="font-semibold text-[#64748B] hover:text-[#0F172A] transition"
                  >
                    ← Back to Details
                  </button>

                  <button
                    type="button"
                    onClick={handleSendCustomerOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="font-bold text-[#2563EB] hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </div>
              )}

              {role === "operator" && (
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="w-full text-center text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition"
                >
                  ← Back to details
                </button>
              )}
            </div>
          )}

          <p className="mt-6 text-center text-[11px] text-[#64748B]">
            By continuing you agree to our Terms & Operator Authorization Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
