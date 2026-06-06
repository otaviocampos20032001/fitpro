"use client";
import { useEffect } from "react";

export default function FetchSanitizer() {
  useEffect(() => {
    const original = window.fetch;
    window.fetch = function (input, init) {
      if (init?.headers) {
        const raw = init.headers;
        const safe: Record<string, string> = {};

        const entries: [string, string][] =
          raw instanceof Headers
            ? Array.from(raw.entries())
            : Array.isArray(raw)
            ? raw
            : Object.entries(raw as Record<string, string>);

        for (const [k, v] of entries) {
          const safeVal = String(v).replace(/[^\x00-\xFF]/g, "");
          safe[k] = safeVal;
        }

        init = { ...init, headers: safe };
      }
      return original.call(this, input, init);
    };

    return () => {
      window.fetch = original;
    };
  }, []);

  return null;
}
