"use client";

import {
  useHasSeenCCTPExplainer,
  useSetHasSeenCCTPExplainer,
  useShowCCTPExplainer,
  useSetShowCCTPExplainer,
  useHasHydrated,
} from "~/lib/bridge/store";

export function useCCTPExplainer() {
  const hasSeenExplainer = useHasSeenCCTPExplainer();
  const setHasSeenExplainer = useSetHasSeenCCTPExplainer();
  const showExplainer = useShowCCTPExplainer();
  const setShowExplainer = useSetShowCCTPExplainer();
  const hasHydrated = useHasHydrated();

  // Show when manually opened OR when first-time user (hydrated and hasn't seen)
  const isFirstTime = hasHydrated && !hasSeenExplainer;
  const isOpen = showExplainer || isFirstTime;

  const handleClose = () => {
    // Mark as seen (for first-time users)
    if (!hasSeenExplainer) {
      setHasSeenExplainer(true);
    }
    // Close manual trigger
    setShowExplainer(false);
  };

  const handleOpen = () => {
    setShowExplainer(true);
  };

  return {
    isOpen,
    onClose: handleClose,
    onOpen: handleOpen,
  };
}
