// In-memory data store for STB RECHARGE (Pure Frontend - Supabase removed).
import { useSyncExternalStore } from "react";
import { cleanMobile, cleanContact, mobileToEmail } from "../utils/utils";
import {
  apiAddOperator,
  apiToggleOperator,
  apiDeleteOperator,
  apiGetOperators,
  apiCreateRecharge,
  apiGetPendingRecharges,
  apiGetOperatorRequests,
  apiApproveRecharge,
  apiRejectRecharge,
  apiGetRechargeStatus,
  apiCreateProductRequest,
  apiGetProductRequests,
  apiUpdateProductRequestStatus,
  apiCreateComplaint,
  apiGetComplaints,
  apiUpdateComplaintStatus,
  apiVerifyOtp,
  apiGetUserProfile,
  apiValidateStb,
  apiMapStb,
  apiGetOperatorStbs,
  apiDeleteStbMapping,
  apiGetProducts,
  apiUpsertProduct,
  apiDeleteProduct,
} from "./api";
import { VENKATESA_OPERATOR, VENKATESA_STB_MAPPINGS } from "./venkatesaStbs";

export { cleanMobile, cleanContact, mobileToEmail } from "../utils/utils";

export type Plan = {
  id: string;
  _id?: string;
  name: string;
  price: number;
  validityDays: number;
  category: "Monthly" | "Channels" | "Add-on";
  features: string[];
  popular?: boolean;
  channels?: number;
};

export type Product = {
  id: string;
  name: string;
  category: "accessory" | "service";
  price: number;
  availableStock: number;
  soldQuantity: number;
  description?: string;
  iconName?: string;
};

export type ProductRequestStatus =
  | "Pending"
  | "Processing"
  | "Out for Delivery"
  | "Installation Scheduled"
  | "Completed"
  | "Not Available";

export type ProductRequest = {
  id: string;
  stbId: string;
  customerName: string;
  customerMobile: string;
  productId: string;
  productName: string;
  category: "accessory" | "service";
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  description: string;
  imageUrl?: string;
  status: ProductRequestStatus;
  createdAt: string;
  technicianName?: string;
  technicianMobile?: string;
  scheduledDate?: string;
  operatorNote?: string;
};

export type ComplaintStatus = "Pending" | "Assigned" | "In Progress" | "Resolved";

export type Complaint = {
  id: string;
  stbId: string;
  customerName: string;
  customerMobile: string;
  category: "TV Issues" | "STB Issues" | "Cable Connection Issues" | "Recharge Issues" | string;
  issueType: string;
  description: string;
  mediaUrl?: string;
  preferredTime: string;
  status: ComplaintStatus;
  createdAt: string;
  technicianName?: string;
  technicianMobile?: string;
  assignedAt?: string;
  expectedArrival?: string;
  resolvedAt?: string;
  rating?: number;
  feedback?: string;
};

export type Txn = {
  id: string;
  planName: string;
  amount: number;
  date: string;
  status: "pending" | "success" | "failed";
  approvedAt?: string;
  customerName?: string;
  customerMobile?: string;
  stbId?: string;
  startedAt?: number;
  syncedToBackend?: boolean;
};

export type STB = {
  id: string;
  customerName: string;
  currentPlan: string;
  expiry: string;
  active: boolean;
  operatorMobile?: string;
};

export type ApprovedOperator = {
  id: string;
  mobile: string;
  name: string;
  email?: string;
  stbBoxName?: "SCV" | "TCCL" | "AKSHAYA DIGINET" | "TACTV" | string;
  portalLink?: string;
  addedAt: string;
  active: boolean;
};

export type User = {
  id?: string;
  mobile: string;
  name?: string;
  email?: string;
  operatorNumber?: string;
  operatorMobile?: string;
  operatorName?: string;
  stbId?: string;
  role: "operator" | "customer" | "admin";
};

export type StbMapping = {
  id: string;
  _id?: string;
  stbId: string;
  operatorMobile: string;
  operatorName?: string;
  customerName?: string;
  customerMobile?: string;
  currentPlan?: string;
  expiryDate?: string;
  isApproved?: boolean;
  status?: string;
  createdAt?: string;
};

export type State = {
  user: User | null;
  stb: STB | null;
  autoRecharge: { enabled: boolean; planId?: string };
  pending: { txnId: string; planName: string; amount: number; startedAt: number; stbId?: string; customerMobile?: string } | null;
  txns: Txn[];
  plans: Plan[];
  products: Product[];
  productRequests: ProductRequest[];
  complaints: Complaint[];
  stbMappings: StbMapping[];
  appliedCoupon: string | null;
  selectedPlanId: string | null;
  selectedPlanObject?: any;
  approvedOperators: ApprovedOperator[];
  blockedCustomers: string[];
  ready: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "m1",
    name: "Basic Tamil Pack Monthly Rs 220",
    price: 220,
    validityDays: 30,
    category: "Monthly",
    features: ["150+ SD Channels", "Standard Definition", "1 STB"],
    channels: 150,
  },
  {
    id: "m2",
    name: "Basic Tamil Silver Pack Monthly Rs 240",
    price: 240,
    validityDays: 30,
    category: "Monthly",
    features: ["300+ HD Channels", "Full HD Quality", "OTT App bundle"],
    popular: true,
    channels: 300,
  },
  {
    id: "m3",
    name: "Basic Tamil HD Packs Rs 300",
    price: 300,
    validityDays: 30,
    category: "Monthly",
    features: ["400+ Channels", "4K where available", "3 months validity"],
    channels: 400,
  },
  {
    id: "c1",
    name: "Sports Pack Rs 49",
    price: 49,
    validityDays: 30,
    category: "Channels",
    features: ["Star Sports HD", "Sony Sports", "Willow Cricket"],
    channels: 18,
  },
  {
    id: "c2",
    name: "HD Movies Pack Rs 79",
    price: 79,
    validityDays: 30,
    category: "Channels",
    features: ["Star Movies", "&pictures HD", "Sony Pix"],
    channels: 22,
  },
  {
    id: "c3",
    name: "Kids Pack Rs 49",
    price: 49,
    validityDays: 30,
    category: "Channels",
    features: ["Cartoon Network", "Nick HD+", "Disney"],
    channels: 12,
  },
  {
    id: "a1",
    name: "OTT Add-on (Hotstar)",
    price: 99,
    validityDays: 30,
    category: "Add-on",
    features: ["Disney+ Hotstar Mobile", "1 device"],
  },
  {
    id: "a2",
    name: "Regional Bhasha Pack",
    price: 59,
    validityDays: 30,
    category: "Add-on",
    features: ["25+ regional channels"],
  },
];

export const INITIAL_SEED_PRODUCTS: Product[] = [];

export const INITIAL_SEED_PRODUCT_REQUESTS: ProductRequest[] = [];
export const INITIAL_SEED_COMPLAINTS: Complaint[] = [];
export const INITIAL_APPROVED_OPERATORS: ApprovedOperator[] = [VENKATESA_OPERATOR];

const defaultState: State = {
  user: null,
  stb: null,
  autoRecharge: { enabled: false },
  pending: null,
  txns: [],
  plans: PLANS,
  products: INITIAL_SEED_PRODUCTS,
  productRequests: INITIAL_SEED_PRODUCT_REQUESTS,
  complaints: INITIAL_SEED_COMPLAINTS,
  stbMappings: VENKATESA_STB_MAPPINGS,
  appliedCoupon: null,
  selectedPlanId: null,
  selectedPlanObject: null,
  approvedOperators: INITIAL_APPROVED_OPERATORS,
  blockedCustomers: [],
  ready: true,
};

export function selectPlan(planOrId: any) {
  if (typeof planOrId === "object" && planOrId !== null) {
    const id = planOrId.id || planOrId._id || (planOrId.price === 300 ? "m3" : planOrId.price === 240 ? "m2" : "m1");
    setState({ selectedPlanId: id, selectedPlanObject: planOrId });
  } else {
    setState({ selectedPlanId: String(planOrId || "") });
  }
}

let state: State = defaultState;
const listeners = new Set<() => void>();

// Local storage key
const STORAGE_KEY = "stb_recharge_local_state_v1";

function loadSavedState(): State {
  if (typeof window === "undefined") return defaultState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      let cleanOps = ((parsed.approvedOperators || INITIAL_APPROVED_OPERATORS) as ApprovedOperator[]).filter(
        (op) => op && op.mobile !== "9080864542"
      );
      if (!cleanOps.some((op) => op.mobile === "9787312758")) {
        cleanOps.push(VENKATESA_OPERATOR);
      }
      // Remove any old seed products prod-1 through prod-10
      const cleanProds = Array.isArray(parsed.products)
        ? (parsed.products as Product[]).filter(
            (p) => p && !["prod-1", "prod-2", "prod-3", "prod-4", "prod-5", "prod-6", "prod-7", "prod-8", "prod-9", "prod-10"].includes(p.id)
          )
        : [];

      // Ensure all 360 STB mappings for 9787312758 exist in stbMappings
      let currentStbs: StbMapping[] = Array.isArray(parsed.stbMappings) ? parsed.stbMappings : [];
      const existingStbIds = new Set(currentStbs.map((m) => m.stbId));
      const missingVenStbs = VENKATESA_STB_MAPPINGS.filter((m) => !existingStbIds.has(m.stbId));
      const mergedStbs = [...currentStbs, ...missingVenStbs];

      return {
        ...defaultState,
        ...parsed,
        approvedOperators: cleanOps,
        products: cleanProds,
        stbMappings: mergedStbs,
        ready: true,
      };
    }
  } catch (e) {
    console.error("Failed to load local state", e);
  }
  return defaultState;
}

const syncChannel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("stb_recharge_sync_channel")
    : null;

function saveState(broadcast = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: "STATE_UPDATED" });
    }
  } catch (e) {
    console.error("Failed to save local state", e);
  }
}

// Listen for instant cross-tab / multi-window sync
if (typeof window !== "undefined") {
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      if (event.data?.type === "STATE_UPDATED") {
        const saved = loadSavedState();
        state = { ...state, ...saved };
        listeners.forEach((l) => l());
      }
    };
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        state = { ...state, ...parsed };
        listeners.forEach((l) => l());
      } catch (e) {
        console.warn("Failed to sync storage event", e);
      }
    }
  });
}

function emit() {
  saveState();
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  emit();
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => subscribe(l),
    () => selector(state),
    () => selector(defaultState),
  );
}

// Booting and session
let booted = false;

export async function syncAccountFromBackend(mobileNumber?: string) {
  const targetMobile = mobileNumber || state.user?.mobile;
  if (!targetMobile) return;

  try {
    const res = await apiGetUserProfile(targetMobile);
    if (res.success && res.data?.user) {
      const uData = res.data.user;
      const rechargesData = res.data.recharges || [];
      const prodReqsData = res.data.productRequests || [];
      const complaintsData = res.data.complaints || [];

      const isOpApproved = isOperatorApproved(uData.mobileNumber || targetMobile);
      let resolvedRole: User["role"] = uData.role || state.user?.role || "customer";
      if (uData.mobileNumber === "9080864542" || targetMobile === "9080864542") {
        resolvedRole = "admin";
      } else if (isOpApproved || uData.role === "operator") {
        resolvedRole = "operator";
      }

      const updatedUser: User = {
        ...(state.user || {}),
        id: uData.id || uData._id || `usr-${uData.mobileNumber}`,
        mobile: uData.mobileNumber || targetMobile,
        name: uData.name || state.user?.name || (resolvedRole === "operator" ? "Operator" : "Customer"),
        stbId: uData.stbId || state.user?.stbId || `STB-${uData.mobileNumber.slice(-6)}`,
        role: resolvedRole,
      };


      const defaultExpiry = new Date(Date.now() + 15 * 86400000).toISOString();
      const expiryDate = uData.expiryDate
        ? new Date(uData.expiryDate).toISOString()
        : state.stb?.expiry || defaultExpiry;

      const updatedStb: STB = {
        id: updatedUser.stbId || "1234567890",
        customerName: updatedUser.name || "Customer",
        currentPlan: uData.currentPlan || state.stb?.currentPlan || "Basic Tamil Silver Pack Monthly Rs 240",
        expiry: expiryDate,
        active: uData.status !== "Inactive",
      };

      const userTxns: Txn[] = rechargesData.map((r: any) => ({
        id: r._id || r.id,
        planName: r.planId?.name || r.planName || "STB Recharge",
        amount: r.amount || r.planId?.price || 0,
        date: r.requestTime || r.createdAt || new Date().toISOString(),
        status: r.status === "Approved" ? "success" : r.status === "Rejected" ? "failed" : "pending",
        approvedAt: r.approvedTime,
        customerName: r.customerName || updatedUser.name,
        customerMobile: r.customerMobile || updatedUser.mobile,
        stbId: r.stbId || updatedUser.stbId,
        startedAt: new Date(r.requestTime || r.createdAt).getTime(),
      }));

      const userProdReqs: ProductRequest[] = prodReqsData.map((r: any) => ({
        id: r._id || r.id,
        stbId: r.stbId || updatedUser.stbId || "STB-UNKNOWN",
        customerName: r.customerName || updatedUser.name || "Customer",
        customerMobile: r.customerMobile || updatedUser.mobile || "",
        productId: r.productId,
        productName: r.productName,
        category: r.category || "accessory",
        quantity: r.quantity || 1,
        unitPrice: r.unitPrice || 0,
        totalAmount: r.totalAmount || 0,
        description: r.description || "",
        imageUrl: r.imageUrl || "",
        status: r.status || "Pending",
        createdAt: r.createdAt || new Date().toISOString(),
        technicianName: r.technicianName,
        technicianMobile: r.technicianMobile,
        scheduledDate: r.scheduledDate,
        operatorNote: r.operatorNote,
      }));

      const userComplaints: Complaint[] = complaintsData.map((c: any) => ({
        id: c._id || c.id,
        stbId: c.stbId || updatedUser.stbId || "STB-UNKNOWN",
        customerName: c.customerName || updatedUser.name || "Customer",
        customerMobile: c.customerMobile || updatedUser.mobile || "",
        category: c.category || "General Issues",
        issueType: c.issueType || "",
        description: c.description || "",
        mediaUrl: c.mediaUrl || "",
        preferredTime: c.preferredTime || "Anytime",
        status: c.status || "Pending",
        createdAt: c.createdAt || new Date().toISOString(),
        technicianName: c.technicianName,
        technicianMobile: c.technicianMobile,
        assignedAt: c.assignedAt,
        expectedArrival: c.expectedArrival,
        resolvedAt: c.resolvedAt,
        rating: c.rating,
        feedback: c.feedback,
      }));

      // Guard: Do not restore user if logged out or if target user does not match current state
      if (!state.user || (state.user.mobile !== targetMobile && state.user.mobile !== uData.mobileNumber)) {
        return;
      }

      if (updatedUser.role === "customer") {
        const currentPending = state.pending;
        let newPending = currentPending;

        if (currentPending) {
          const userMobileClean = cleanMobile(updatedUser.mobile);
          const approvedOrRejected = userTxns.find(
            (t) =>
              (t.id === currentPending.txnId ||
                (userMobileClean && cleanMobile(t.customerMobile || "") === userMobileClean)) &&
              (t.status === "success" || t.status === "failed")
          );
          if (approvedOrRejected) {
            newPending = null;
          }
        }

        setState({
          user: updatedUser,
          stb: updatedStb,
          pending: newPending,
          txns: userTxns,
          productRequests: userProdReqs,
          complaints: userComplaints,
          ready: true,
        });
      } else {
        setState({
          user: updatedUser,
          stb: updatedStb,
          ready: true,
        });
      }
    }
  } catch (err) {
    console.warn("Failed to sync account from backend", err);
  }
}

let pollTimer: any = null;

export async function initStore() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  state = loadSavedState();
  setState({ ready: true });

  if (state.user?.mobile) {
    syncAccountFromBackend(state.user.mobile);
  }

  syncOperatorsFromBackend();
  syncProductsFromBackend();
  syncPendingRechargesFromBackend();
  syncProductRequestsFromBackend();
  syncComplaintsFromBackend();

  if (!pollTimer) {
    pollTimer = setInterval(() => {
      if (state.user?.mobile) {
        syncAccountFromBackend(state.user.mobile);
      }
      syncOperatorsFromBackend();
      syncProductsFromBackend();
      syncPendingRechargesFromBackend();
      syncProductRequestsFromBackend();
      syncComplaintsFromBackend();
    }, 4000);
  }
}


export async function refreshUserData() {
  setState({ ready: true });
  if (state.user?.mobile) {
    await syncAccountFromBackend(state.user.mobile);
  }
}

export async function refreshAdminData() {
  setState({ ready: true });
  syncOperatorsFromBackend();
}

export async function refreshCatalogue() {
  setState({ ready: true });
}

// Auth helpers
export function sendOtp(mobile: string) {
  console.log(`[STB Local Auth] OTP for ${mobile} is ready`);
  return Promise.resolve();
}

export function isOperatorApproved(contact: string): boolean {
  if (!contact) return false;
  const cleaned = cleanContact(contact);
  const digitsOnly = cleanMobile(contact);
  const trimmed = contact.trim().toLowerCase();

  if (digitsOnly === "9080864542" || digitsOnly === "9787312758" || cleaned === "9080864542" || cleaned === "9787312758") return true;

  return state.approvedOperators.some((op) => {
    if (!op.active) return false;
    const opCleaned = cleanContact(op.mobile);
    const opDigits = cleanMobile(op.mobile);
    const opCleanStr = op.mobile.trim().toLowerCase();
    return (
      (cleaned.length > 0 && opCleaned === cleaned) ||
      (digitsOnly.length > 0 && opDigits === digitsOnly) ||
      (opDigits.length >= 5 && digitsOnly.includes(opDigits)) ||
      (opDigits.length >= 5 && opDigits.includes(digitsOnly)) ||
      opCleanStr === trimmed
    );
  });
}

export function isCustomerBlocked(identifier: string): boolean {
  if (!identifier) return false;
  const cleaned = identifier.trim().toLowerCase();
  return state.blockedCustomers.some((c) => c.toLowerCase() === cleaned);
}

export async function verifyOtp(
  mobile: string,
  otp: string,
  name?: string,
  role: "operator" | "customer" | "admin" = "customer",
  extra?: { email?: string; operatorNumber?: string; stbId?: string },
): Promise<boolean> {
  const isEmail = mobile.includes("@");
  const cleanedMobile = isEmail ? mobile.trim().toLowerCase() : cleanMobile(mobile);
  if (otp.trim().length < 4) return false;
  if (!isEmail && cleanedMobile.length < 10 && cleanedMobile !== "9080864542") return false;

  await syncOperatorsFromBackend();

  let effectiveRole: User["role"] = role;
  if (cleanedMobile === "9080864542") {
    effectiveRole = "admin";
  } else if (isOperatorApproved(mobile)) {
    effectiveRole = "operator";
  }

  if (isCustomerBlocked(mobile) && effectiveRole === "customer") {
    return false;
  }

  try {
    const res = await apiVerifyOtp(cleanedMobile, otp, name, extra?.stbId);
    if (res.success && res.data?.user?.role) {
      effectiveRole = res.data.user.role as User["role"];
    }
  } catch (e) {
    console.warn("Backend verify OTP warning:", e);
  }

  const user: User = {
    id: `usr-${cleanedMobile}`,
    mobile: cleanedMobile,
    name: name || (effectiveRole === "admin" ? "Kathiravan V" : "Customer"),
    email: extra?.email || (isEmail ? mobile : mobileToEmail(cleanedMobile)),
    stbId: extra?.stbId || `STB-${cleanedMobile.slice(-6)}`,
    operatorNumber: extra?.operatorNumber,
    role: effectiveRole,
  };

  const stb: STB = {
    id: user.stbId || "1234567890",
    customerName: user.name || "Customer",
    currentPlan: "Basic Tamil Silver Pack Monthly Rs 240",
    expiry: new Date(Date.now() + 15 * 86400000).toISOString(),
    active: true,
  };

  setState({ user, stb, ready: true });
  await syncAccountFromBackend(cleanedMobile);
  return true;
}


export async function logout() {
  state = {
    ...defaultState,
    user: null,
    stb: null,
    pending: null,
    txns: [],
    stbMappings: [],
    productRequests: [],
    complaints: [],
    appliedCoupon: null,
    ready: true,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("stb_recharge_jwt_token");
      sessionStorage.clear();
      saveState(true);
    } catch (e) {
      console.warn("Storage clear error on logout", e);
    }
  }
  listeners.forEach((l) => l());
}

// STB management
export async function fetchStb(id: string): Promise<STB | null> {
  if (state.user?.mobile) {
    await syncAccountFromBackend(state.user.mobile);
  }
  return state.stb;
}


// Transactions & Recharge Flow
export async function startPayment(
  planId: string,
  amount: number,
  planName: string,
  customDetails?: { stbId?: string; customerName?: string; customerMobile?: string },
) {
  const localTxnId = "TXN" + Math.floor(Math.random() * 900000 + 100000);
  const now = Date.now();
  const user = state.user;
  const stb = state.stb;

  const rawStbId = customDetails?.stbId || stb?.id || user?.stbId || "1234567890";
  const targetStbId = rawStbId.trim().toUpperCase();
  const targetCustomerName = customDetails?.customerName || user?.name || "Customer";
  const targetCustomerMobile = customDetails?.customerMobile || user?.mobile || "";

  const pending = { txnId: localTxnId, planName, amount, startedAt: now, stbId: targetStbId, customerMobile: targetCustomerMobile };

  const newTxn: Txn = {
    id: localTxnId,
    planName,
    amount,
    date: new Date(now).toISOString(),
    status: "pending",
    customerName: targetCustomerName,
    customerMobile: targetCustomerMobile,
    stbId: targetStbId,
    startedAt: now,
    syncedToBackend: true, // Prevent concurrent auto-retry loop duplicate creation
  };

  setState({
    pending,
    txns: [newTxn, ...state.txns],
  });

  try {
    const res = await apiCreateRecharge({
      userId: user?.id,
      stbId: targetStbId,
      planId,
      planName,
      amount,
      customerName: targetCustomerName,
      customerMobile: targetCustomerMobile,
      paymentStatus: "Success",
    });

    const backendId =
      res.data?.rechargeRequest?._id ||
      (res.data as any)?.data?.rechargeRequest?._id ||
      (res.data as any)?.rechargeRequest?.id;

    if (res.success && backendId) {
      const currentPending = state.pending;
      const isPendingMatch = currentPending?.txnId === localTxnId;
      const updatedTxns = state.txns.map((t) =>
        t.id === localTxnId ? { ...t, id: backendId, stbId: targetStbId, syncedToBackend: true } : t,
      );
      setState({
        txns: updatedTxns,
        pending: isPendingMatch && currentPending ? { ...currentPending, txnId: backendId, stbId: targetStbId, customerMobile: targetCustomerMobile } : state.pending,
      });
    } else {
      console.warn("apiCreateRecharge info:", res.error || "Backend request queued");
    }
  } catch (err: any) {
    console.warn("Failed to save recharge to backend:", err.message);
  }
}

export async function approveTxn(txnId: string) {
  const now = new Date().toISOString();
  const updatedTxns = state.txns.map((t) =>
    t.id === txnId ? { ...t, status: "success" as const, approvedAt: now } : t,
  );
  const target = updatedTxns.find((t) => t.id === txnId);

  let newStb = state.stb;
  if (target && newStb) {
    newStb = {
      ...newStb,
      currentPlan: target.planName,
      expiry: new Date(Date.now() + 30 * 86400000).toISOString(),
      active: true,
    };
  }

  const isPendingCleared = state.pending?.txnId === txnId;
  setState({
    txns: updatedTxns,
    stb: newStb,
    pending: isPendingCleared ? null : state.pending,
  });

  apiApproveRecharge(txnId);
}

export async function rejectTxn(txnId: string) {
  const updatedTxns = state.txns.map((t) =>
    t.id === txnId ? { ...t, status: "failed" as const } : t,
  );
  const isPendingCleared = state.pending?.txnId === txnId;
  setState({
    txns: updatedTxns,
    pending: isPendingCleared ? null : state.pending,
  });

  apiRejectRecharge(txnId);
}


// Product Requests
export async function requestProduct(payload: {
  productId: string;
  quantity?: number;
  description: string;
  imageUrl?: string;
  stbId?: string;
  customerName?: string;
  customerMobile?: string;
}) {
  const u = state.user;
  const stb = state.stb;
  const prod = state.products.find((p) => p.id === payload.productId);

  const localId = "REQ" + Math.floor(Math.random() * 900000 + 100000);
  const req: ProductRequest = {
    id: localId,
    stbId: payload.stbId || stb?.id || u?.stbId || "1234567890",
    customerName: payload.customerName || u?.name || "Customer",
    customerMobile: payload.customerMobile || u?.mobile || "",
    productId: payload.productId,
    productName: prod?.name || "Accessory/Service Request",
    category: prod?.category || "accessory",
    quantity: payload.quantity || 1,
    unitPrice: prod?.price || 0,
    totalAmount: (prod?.price || 0) * (payload.quantity || 1),
    description: payload.description,
    imageUrl: payload.imageUrl,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  setState({ productRequests: [req, ...state.productRequests] });

  try {
    const res = await apiCreateProductRequest(req);
    if (res.success && res.data?.productRequest?._id) {
      const backendId = res.data.productRequest._id;
      const updated = state.productRequests.map((r) => (r.id === localId ? { ...r, id: backendId } : r));
      setState({ productRequests: updated });
    }
  } catch (err) {
    console.warn("Failed to save product request to backend", err);
  }
}

export async function updateProductStatus(
  id: string,
  patch: Partial<ProductRequest> & { status: ProductRequestStatus },
) {
  const updated = state.productRequests.map((r) => (r.id === id ? { ...r, ...patch } : r));
  setState({ productRequests: updated });

  try {
    await apiUpdateProductRequestStatus(id, patch);
  } catch (err) {
    console.warn("Failed to update product request status on backend", err);
  }
}

// Complaints
export async function fileComplaint(payload: {
  category: string;
  issueType: string;
  description: string;
  mediaUrl?: string;
  preferredTime: string;
  stbId?: string;
  customerName?: string;
  customerMobile?: string;
}) {
  const u = state.user;
  const stb = state.stb;

  const localId = "CMP" + Math.floor(Math.random() * 900000 + 100000);
  const cmp: Complaint = {
    id: localId,
    stbId: payload.stbId || stb?.id || u?.stbId || "1234567890",
    customerName: payload.customerName || u?.name || "Customer",
    customerMobile: payload.customerMobile || u?.mobile || "",
    category: payload.category,
    issueType: payload.issueType,
    description: payload.description,
    mediaUrl: payload.mediaUrl,
    preferredTime: payload.preferredTime,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  setState({ complaints: [cmp, ...state.complaints] });

  try {
    const res = await apiCreateComplaint(cmp);
    if (res.success && res.data?.complaint?._id) {
      const backendId = res.data.complaint._id;
      const updated = state.complaints.map((c) => (c.id === localId ? { ...c, id: backendId } : c));
      setState({ complaints: updated });
    }
  } catch (err) {
    console.warn("Failed to save complaint to backend", err);
  }
}

export async function updateComplaintStatus(
  id: string,
  patch: Partial<Complaint> & { status: ComplaintStatus },
) {
  const updated = state.complaints.map((c) => (c.id === id ? { ...c, ...patch } : c));
  setState({ complaints: updated });

  try {
    await apiUpdateComplaintStatus(id, patch);
  } catch (err) {
    console.warn("Failed to update complaint status on backend", err);
  }
}

export async function rateComplaint(id: string, rating: number, feedback?: string) {
  const updated = state.complaints.map((c) => (c.id === id ? { ...c, rating, feedback } : c));
  setState({ complaints: updated });

  try {
    await apiUpdateComplaintStatus(id, { rating, feedback });
  } catch (err) {
    console.warn("Failed to submit rating on backend", err);
  }
}

// Settings & Coupons
export function toggleAutoRecharge(planId?: string) {
  setState({
    autoRecharge: {
      enabled: !state.autoRecharge.enabled,
      planId: planId ?? state.autoRecharge.planId,
    },
  });
}

export function applyCoupon(code: string): { success: boolean; discount: number; message: string } {
  const clean = code.trim().toUpperCase();
  if (clean === "SAVE50") {
    setState({ appliedCoupon: clean });
    return { success: true, discount: 50, message: "Rs 50 discount applied!" };
  }
  if (clean === "STB10") {
    setState({ appliedCoupon: clean });
    return { success: true, discount: 10, message: "10% discount applied!" };
  }
  return { success: false, discount: 0, message: "Invalid promo code" };
}

// Admin Operations
export async function upsertOperator(
  mobile: string,
  name: string,
  stbBoxName?: string,
  portalLink?: string,
  email?: string,
  active = true
): Promise<{ success: boolean; message?: string }> {
  const cleaned = cleanContact(mobile);
  if (!cleaned) {
    return { success: false, message: "Invalid mobile number or email address" };
  }
  const exists = state.approvedOperators.find((o) => cleanContact(o.mobile) === cleaned);
  let updatedOps: ApprovedOperator[];
  if (exists) {
    updatedOps = state.approvedOperators.map((o) =>
      cleanContact(o.mobile) === cleaned
        ? {
            ...o,
            mobile: cleaned,
            name,
            email: email || o.email || "",
            stbBoxName: stbBoxName || o.stbBoxName || "SCV",
            portalLink: portalLink !== undefined ? portalLink : o.portalLink,
            active,
          }
        : o,
    );
  } else {
    updatedOps = [
      ...state.approvedOperators,
      {
        id: "op-" + Date.now(),
        mobile: cleaned,
        name,
        email: email || "",
        stbBoxName: stbBoxName || "SCV",
        portalLink: portalLink || "",
        addedAt: new Date().toISOString(),
        active,
      },
    ];
  }
  setState({ approvedOperators: updatedOps });

  try {
    const res = await apiAddOperator(cleaned, name, stbBoxName, portalLink, email);
    if (!res.success) {
      console.warn("Backend add operator warning:", res.error);
      return { success: false, message: res.error || "Failed to save operator to server database" };
    }
    return { success: true };
  } catch (err: any) {
    console.warn("apiAddOperator error:", err);
    return { success: false, message: err.message || "Network request failed" };
  }
}

export async function setOperatorActive(id: string, active: boolean) {
  const op = state.approvedOperators.find((o) => o.id === id);
  const updated = state.approvedOperators.map((o) => (o.id === id ? { ...o, active } : o));
  setState({ approvedOperators: updated });
  if (op) {
    apiToggleOperator(op.mobile);
  }
}

export async function removeApprovedOperator(id: string) {
  const target = state.approvedOperators.find((o) => o.id === id || o.mobile === id);
  const targetMobile = target ? target.mobile : id;
  const updated = state.approvedOperators.filter(
    (o) => o.id !== id && o.mobile !== id && cleanContact(o.mobile) !== cleanContact(targetMobile)
  );
  setState({ approvedOperators: updated });
  try {
    if (targetMobile) {
      await apiDeleteOperator(targetMobile);
    }
    if (target?.id && target.id !== targetMobile) {
      await apiDeleteOperator(target.id);
    }
  } catch (e) {
    console.warn("Failed to delete operator on backend", e);
  }
}

export async function blockCustomer(identifier: string) {
  const cleaned = identifier.trim();
  if (!state.blockedCustomers.includes(cleaned)) {
    setState({ blockedCustomers: [...state.blockedCustomers, cleaned] });
  }
}

export async function unblockCustomer(identifier: string) {
  const cleaned = identifier.trim();
  setState({
    blockedCustomers: state.blockedCustomers.filter((c) => c !== cleaned),
  });
}

export async function upsertProduct(prod: Partial<Product> & { id: string; name: string }) {
  const exists = state.products.find((p) => p.id === prod.id);
  let updated: Product[];
  let targetP: Product;
  if (exists) {
    targetP = { ...exists, ...prod };
    updated = state.products.map((p) => (p.id === prod.id ? targetP : p));
  } else {
    targetP = {
      id: prod.id,
      name: prod.name,
      category: prod.category || "accessory",
      price: prod.price || 100,
      availableStock: prod.availableStock || 50,
      soldQuantity: prod.soldQuantity || 0,
      description: prod.description,
      iconName: prod.iconName,
    };
    updated = [...state.products, targetP];
  }
  setState({ products: updated });
  await apiUpsertProduct(targetP);
}

export async function removeProduct(id: string) {
  setState({ products: state.products.filter((p) => p.id !== id) });
  await apiDeleteProduct(id);
}

export async function resetAllData() {
  setState({ ...defaultState, ready: true });
}

export function formatName(name?: string) {
  if (!name) return "Customer";
  return name.trim();
}

// Backend Synchronization Functions
export async function syncPendingRechargesFromBackend(operatorMobile?: string) {
  try {
    const isCustomer = state.user?.role === "customer";
    const op = operatorMobile || (isCustomer ? undefined : state.user?.mobile || state.user?.operatorNumber);
    const res = await apiGetOperatorRequests(op);
    if (res.success && Array.isArray(res.data?.requests)) {
      const backendTxns: Txn[] = res.data.requests.map((r: any) => {
        const rawStatus = (r.status || "Pending").trim().toLowerCase();
        let normalizedStatus: "pending" | "success" | "failed" = "pending";
        if (rawStatus === "approved" || rawStatus === "success" || rawStatus === "completed") {
          normalizedStatus = "success";
        } else if (rawStatus === "rejected" || rawStatus === "failed") {
          normalizedStatus = "failed";
        }

        return {
          id: r._id || r.id || "TXN-" + Date.now(),
          planName: r.planId?.name || r.planName || "Recharge Pack",
          amount: r.amount || 240,
          date: r.requestTime || r.createdAt || new Date().toISOString(),
          status: normalizedStatus,
          customerName: r.customerName || (typeof r.userId === "object" ? r.userId?.name : "Customer"),
          customerMobile: r.customerMobile || (typeof r.userId === "object" ? r.userId?.mobileNumber : ""),
          stbId: r.stbId || (typeof r.userId === "object" ? r.userId?.stbId : "1234567890"),
          syncedToBackend: true,
        };
      });

      const currentPending = state.pending;
      let newPending = currentPending;
      if (currentPending) {
        const pTxnId = currentPending.txnId;
        const pStbId = (currentPending.stbId || state.stb?.id || state.user?.stbId || "").trim().toUpperCase();
        const pMobile = cleanMobile(currentPending.customerMobile || state.user?.mobile || "");

        const matchingTxn = backendTxns.find((t) => {
          if (t.id === pTxnId) return true;
          const tStb = (t.stbId || "").trim().toUpperCase();
          if (pStbId && tStb === pStbId && t.status !== "pending") return true;
          const tMobile = cleanMobile(t.customerMobile || "");
          if (pMobile && tMobile && pMobile === tMobile && t.status !== "pending") return true;
          return false;
        });

        if (matchingTxn && (matchingTxn.status === "success" || matchingTxn.status === "failed")) {
          newPending = null;
        }
      }

      let newStb = state.stb;
      const userStbId = (state.stb?.id || state.user?.stbId || "").trim().toUpperCase();
      const userMobileDigits = cleanMobile(state.user?.mobile || "");

      const approvedTxnForUser = backendTxns.find((t) => {
        if (t.status !== "success") return false;
        const tStb = (t.stbId || "").trim().toUpperCase();
        const tMobileDigits = cleanMobile(t.customerMobile || "");
        return (userStbId && tStb === userStbId) || (userMobileDigits && tMobileDigits && userMobileDigits === tMobileDigits);
      });

      if (approvedTxnForUser && newStb) {
        newStb = {
          ...newStb,
          currentPlan: approvedTxnForUser.planName,
          expiry: new Date(Date.now() + 30 * 86400000).toISOString(),
          active: true,
        };
      }

      // Merge local txns with backend txns so no request is ever lost
      const existingTxns = state.txns || [];
      const mergedMap = new Map<string, Txn>();

      backendTxns.forEach((t) => mergedMap.set(t.id, t));
      existingTxns.forEach((t) => {
        if (!mergedMap.has(t.id)) {
          mergedMap.set(t.id, t);
        }
      });

      const finalTxns = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setState({
        txns: finalTxns,
        pending: newPending,
        stb: newStb,
      });
    }
  } catch (err) {
    console.warn("Failed to sync recharges from backend", err);
  }
}

export async function syncProductRequestsFromBackend() {
  try {
    const res = await apiGetProductRequests();
    if (res.success && Array.isArray(res.data?.requests)) {
      const reqs: ProductRequest[] = res.data.requests.map((r: any) => ({
        id: r._id || r.id,
        stbId: r.stbId,
        customerName: r.customerName,
        customerMobile: r.customerMobile,
        productId: r.productId,
        productName: r.productName,
        category: r.category || "accessory",
        quantity: r.quantity || 1,
        unitPrice: r.unitPrice || 0,
        totalAmount: r.totalAmount || 0,
        description: r.description || "",
        status: r.status || "Pending",
        createdAt: r.createdAt || new Date().toISOString(),
        technicianName: r.technicianName,
        technicianMobile: r.technicianMobile,
        scheduledDate: r.scheduledDate,
      }));
      setState({ productRequests: reqs });
    }
  } catch (err) {
    console.warn("Failed to sync product requests from backend", err);
  }
}

export async function syncComplaintsFromBackend() {
  try {
    const res = await apiGetComplaints();
    if (res.success && Array.isArray(res.data?.complaints)) {
      const cmps: Complaint[] = res.data.complaints.map((c: any) => ({
        id: c._id || c.id,
        stbId: c.stbId,
        customerName: c.customerName,
        customerMobile: c.customerMobile,
        category: c.category,
        issueType: c.issueType,
        description: c.description,
        mediaUrl: c.mediaUrl,
        preferredTime: c.preferredTime,
        status: c.status || "Pending",
        createdAt: c.createdAt || new Date().toISOString(),
        technicianName: c.technicianName,
        technicianMobile: c.technicianMobile,
        assignedAt: c.assignedAt,
        expectedArrival: c.expectedArrival,
        resolvedAt: c.resolvedAt,
        rating: c.rating,
        feedback: c.feedback,
      }));
      setState({ complaints: cmps });
    }
  } catch (err) {
    console.warn("Failed to sync complaints from backend", err);
  }
}

export async function syncOperatorsFromBackend() {
  try {
    const res = await apiGetOperators();
    if (res.success && Array.isArray(res.data?.operators)) {
      const ops: ApprovedOperator[] = res.data.operators
        .filter((o: any) => cleanMobile(o.mobileNumber || o.mobile || "") !== "9080864542")
        .map((o: any) => ({
          id: o._id || o.id,
          mobile: o.mobileNumber || o.mobile,
          name: o.name || "Operator",
          email: o.email || "",
          stbBoxName: o.stbBoxName || "SCV",
          portalLink: o.portalLink || "",
          addedAt: o.createdAt || new Date().toISOString(),
          active: o.isActive !== false,
        }));
      setState({ approvedOperators: ops });
    }
  } catch (err) {
    console.warn("Failed to sync operators from backend", err);
  }
}

export async function syncProductsFromBackend() {
  try {
    const res = await apiGetProducts();
    if (res.success && Array.isArray(res.data?.products)) {
      const prods: Product[] = res.data.products.map((p: any) => ({
        id: p._id || p.id,
        name: p.name,
        category: p.category || "accessory",
        price: p.price || 0,
        availableStock: p.availableStock || 0,
        soldQuantity: p.soldQuantity || 0,
        description: p.description || "",
        iconName: p.iconName || "Box",
      }));
      setState({ products: prods });
    }
  } catch (err) {
    console.warn("Failed to sync products from backend", err);
  }
}

export async function syncStbMappingsFromBackend(operatorMobile?: string) {
  try {
    const op = operatorMobile || state.user?.mobile || state.user?.operatorNumber;
    if (!op) return;
    const res = await apiGetOperatorStbs(op);
    if (res.success && Array.isArray(res.data?.mappings)) {
      const backendMappings: StbMapping[] = res.data.mappings.map((m: any) => ({
        id: m._id || m.id,
        _id: m._id,
        stbId: m.stbId,
        operatorMobile: m.operatorMobile,
        operatorName: m.operatorName,
        customerName: m.customerName,
        customerMobile: m.customerMobile,
        currentPlan: m.currentPlan,
        expiryDate: m.expiryDate,
        isApproved: m.isApproved !== false,
        status: m.status || "Approved",
        createdAt: m.createdAt,
      }));

      // Combine backend mappings with VENKATESA_STB_MAPPINGS so all 360 STBs are always preserved
      const backendStbIds = new Set(backendMappings.map((m) => m.stbId));
      const missingVenStbs = VENKATESA_STB_MAPPINGS.filter((m) => !backendStbIds.has(m.stbId));
      const combined = [...backendMappings, ...missingVenStbs];

      setState({ stbMappings: combined });
    }
  } catch (err) {
    console.warn("Failed to sync STB mappings from backend", err);
  }
}

export async function addStbMapping(payload: {
  stbId: string;
  operatorMobile: string;
  operatorName?: string;
  customerName?: string;
  customerMobile?: string;
  currentPlan?: string;
  expiryDate?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiMapStb(payload);
    if (res.success && res.data?.mapping) {
      await syncStbMappingsFromBackend(payload.operatorMobile);
      return { success: true };
    }
    return { success: false, message: res.error || "Failed to map STB ID" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to map STB ID" };
  }
}

export async function deleteStbMappingAction(id: string, operatorMobile?: string) {
  try {
    const res = await apiDeleteStbMapping(id);
    if (res.success) {
      const op = operatorMobile || state.user?.mobile || state.user?.operatorNumber;
      if (op) syncStbMappingsFromBackend(op);
    }
  } catch (err) {
    console.warn("Failed to delete STB mapping", err);
  }
}

