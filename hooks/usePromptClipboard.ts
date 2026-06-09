import { useCallback, useState } from "react";

export function usePromptClipboard(timeoutMs = 1200) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), timeoutMs);
      return true;
    } catch {
      setCopied(false);
      return false;
    }
  }, [timeoutMs]);
  return { copied, copy };
}
