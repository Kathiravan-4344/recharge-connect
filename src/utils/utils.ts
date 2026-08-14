import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanMobile(v: string) {
  if (!v) return "";
  let digits = v.trim().replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  } else if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
}

export function normalizeIndianPhoneNumber(rawInput: string): { valid: boolean; formatted: string; error?: string } {
  if (!rawInput) {
    return { valid: false, formatted: "", error: "Please enter your 10-digit mobile number." };
  }

  let digits = rawInput.trim().replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return {
      valid: false,
      formatted: "",
      error: "Please enter a valid 10-digit mobile number.",
    };
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      valid: false,
      formatted: "",
      error: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
    };
  }

  return { valid: true, formatted: `+91${digits}` };
}

export function cleanContact(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  return cleanMobile(trimmed);
}

export function mobileToEmail(mobile: string) {
  return `${cleanMobile(mobile)}@stb-recharge.app`;
}

import { getState } from "../services/store";

export function getCalculatedExpiryDate(refDate?: string | Date, customCutoffDay?: number): string {
  const now = new Date();
  const currentDay = now.getDate(); // 1-31
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth() + 1; // 1-12

  let cutoffDay = customCutoffDay;
  if (!cutoffDay) {
    try {
      cutoffDay = getState().operatorExpiryDay || 10;
    } catch (e) {
      cutoffDay = 10;
    }
  }

  const effectiveCutoff = Math.max(1, Math.min(28, Number(cutoffDay) || 10));

  // If past cutoff day of current month -> Expiry is cutoff day of NEXT month
  if (currentDay > effectiveCutoff) {
    targetMonth += 1;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }
  }

  const dd = String(effectiveCutoff).padStart(2, "0");
  const mm = String(targetMonth).padStart(2, "0");
  return `${dd}-${mm}-${targetYear}`;
}

