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

export function getCalculatedExpiryDate(refDate?: string | Date): string {
  const d = refDate ? new Date(refDate) : new Date(Date.now() + 30 * 86400000);
  if (isNaN(d.getTime())) return "N/A";

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

