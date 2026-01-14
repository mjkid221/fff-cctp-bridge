"use client";

import { motion, AnimatePresence } from "motion/react";
import { Fuel, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { WindowPortal } from "~/components/ui/window-portal";
import { CCTPFlowDiagram } from "./cctp-flow-diagram";

interface CCTPExplainerViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CCTPExplainerView({ isOpen, onClose }: CCTPExplainerViewProps) {
  return (
    <WindowPortal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 z-[401] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="border-border/50 bg-card overflow-hidden rounded-2xl border shadow-2xl">
                {/* Header */}
                <div className="border-border/30 bg-muted/30 border-b px-6 py-4">
                  <h2 className="text-foreground text-lg font-semibold">
                    How CCTP Works
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    Circle&apos;s Cross-Chain Transfer Protocol
                  </p>
                </div>

                {/* Content */}
                <div className="space-y-5 p-6">
                  {/* Flow Diagram */}
                  <div className="border-border/30 bg-muted/10 rounded-xl border p-4">
                    <CCTPFlowDiagram />
                  </div>

                  {/* Brief explanation */}
                  <p className="text-muted-foreground text-center text-sm">
                    Your USDC is burned on the source chain, verified by
                    Circle&apos;s attestation service, then minted fresh on the
                    destination chain.
                  </p>

                  {/* Gas Notice */}
                  <div className="border-border/50 from-muted/50 to-muted/20 relative overflow-hidden rounded-xl border bg-gradient-to-br p-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-foreground/5 flex size-10 shrink-0 items-center justify-center rounded-xl">
                        <Fuel className="text-muted-foreground size-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-foreground text-sm font-medium">
                          Gas required on destination
                        </p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          You&apos;ll need native tokens (ETH, SOL, etc.) on the
                          destination chain to complete the mint. This platform
                          does not provide gas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-border/30 bg-muted/20 border-t px-6 py-4">
                  <Button onClick={onClose} className="w-full gap-2" size="lg">
                    <span>Continue</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </WindowPortal>
  );
}
