"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeTransition() {
  const { theme, systemTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousTheme, setPreviousTheme] = useState<string | undefined>();

  const currentTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (previousTheme && previousTheme !== currentTheme) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 1000); // Match the transition duration

      return () => clearTimeout(timer);
    }
    setPreviousTheme(currentTheme);
  }, [currentTheme, previousTheme]);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ clipPath: "circle(0% at 50% 50%)" }}
          animate={{ clipPath: "circle(150% at 50% 50%)" }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1,
            ease: [0.645, 0.045, 0.355, 1.0], // Custom easing for smooth dial effect
          }}
          className={`pointer-events-none fixed inset-0 z-[100] ${
            currentTheme === "dark"
              ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
              : "bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100"
          }`}
          style={{
            transformOrigin: "center center",
          }}
        >
          {/* Decorative elements for day/night transition */}
          {currentTheme === "dark" ? (
            <>
              {/* Stars appearing */}
              {[...(Array(20) as unknown[])].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0.8], scale: [0, 1, 0.9] }}
                  transition={{
                    duration: 0.8,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2,
                  }}
                  className="absolute size-1 rounded-full bg-white"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 60}%`,
                  }}
                />
              ))}
              {/* Moon */}
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute top-[20%] right-[20%] size-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 shadow-2xl shadow-slate-400/50"
              >
                {/* Moon craters */}
                <div className="absolute top-[30%] left-[20%] size-4 rounded-full bg-slate-300/40" />
                <div className="absolute top-[50%] right-[25%] size-3 rounded-full bg-slate-300/40" />
                <div className="absolute top-[60%] left-[40%] size-2 rounded-full bg-slate-300/40" />
              </motion.div>
            </>
          ) : (
            <>
              {/* Clouds */}
              {[...(Array(5) as unknown[])].map((_, i) => (
                <motion.div
                  key={`cloud-${i}`}
                  initial={{ opacity: 0, x: -100 }}
                  animate={{
                    opacity: [0, 0.6, 0.4],
                    x: [-100, window.innerWidth + 100],
                  }}
                  transition={{
                    duration: 8 + Math.random() * 4,
                    delay: Math.random() * 0.3,
                    ease: "linear",
                  }}
                  className="absolute rounded-full bg-white/40 blur-xl"
                  style={{
                    width: `${80 + Math.random() * 40}px`,
                    height: `${30 + Math.random() * 20}px`,
                    top: `${10 + Math.random() * 40}%`,
                  }}
                />
              ))}
              {/* Sun */}
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute top-[20%] right-[20%]"
              >
                <div className="relative size-24">
                  {/* Sun rays */}
                  {[...(Array(12) as unknown[])].map((_, i) => (
                    <motion.div
                      key={`ray-${i}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0.8],
                        scale: [0, 1, 1.1],
                      }}
                      transition={{
                        duration: 1,
                        delay: 0.1 * i,
                        repeat: Infinity,
                        repeatType: "reverse",
                        repeatDelay: 0.5,
                      }}
                      className="absolute top-1/2 left-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-t from-yellow-400 to-transparent"
                      style={{
                        transform: `rotate(${i * 30}deg) translateY(-40px)`,
                        transformOrigin: "50% 40px",
                      }}
                    />
                  ))}
                  {/* Sun core */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 shadow-2xl shadow-yellow-400/60" />
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
