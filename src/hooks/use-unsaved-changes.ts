"use client";

import { useEffect, useCallback, useRef, useState } from "react";

/**
 * Hook to track unsaved changes and warn before leaving.
 *
 * - Shows browser "unsaved changes" dialog on refresh/close
 * - Provides `dirty` flag for UI indicators
 * - Provides `markClean` to call after successful save
 * - Provides `markDirty` to call on any field change
 */
export function useUnsavedChanges() {
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);

  const markDirty = useCallback(() => {
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      setDirty(true);
    }
  }, []);

  const markClean = useCallback(() => {
    dirtyRef.current = false;
    setDirty(false);
  }, []);

  // Browser beforeunload — warns on refresh/close
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (dirtyRef.current) {
        e.preventDefault();
      }
    }

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return { dirty, markDirty, markClean };
}
