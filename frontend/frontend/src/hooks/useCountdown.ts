import { useEffect, useState } from "react";

export function useCountdown(startTime: number, durationMs: number) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) {
    return { label: "00:00", pct: 0 };
  }

  const elapsed = Math.max(0, now - startTime);
  const remaining = Math.max(0, durationMs - elapsed);
  const pct = remaining / durationMs;

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const label = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return { label, pct };
}
