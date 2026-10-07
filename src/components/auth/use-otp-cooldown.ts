"use client";

import { useCallback, useEffect, useState } from "react";

export function useOtpCooldown(durationSeconds = 60) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);

  const restart = useCallback(() => setRemaining(durationSeconds), [durationSeconds]);
  return { remaining, canResend: remaining === 0, restart };
}
