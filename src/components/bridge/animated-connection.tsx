"use client";

import { motion } from "motion/react";
import { useEffect, useState, type RefObject } from "react";

interface AnimatedConnectionProps {
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  containerRef: RefObject<HTMLElement | null>;
}

export function AnimatedConnection({
  fromRef,
  toRef,
  containerRef,
}: AnimatedConnectionProps) {
  const [path, setPath] = useState("");
  const [particles, setParticles] = useState<Array<{ id: number; delay: number }>>([]);

  useEffect(() => {
    const updatePath = () => {
      if (!fromRef.current || !toRef.current || !containerRef.current) return;

      const container = containerRef.current.getBoundingClientRect();
      const from = fromRef.current.getBoundingClientRect();
      const to = toRef.current.getBoundingClientRect();

      // Start point: Right edge center of bridge card
      const startX = from.right - container.left;
      const startY = from.top + from.height / 2 - container.top;

      // End point: Left edge center of fee summary card
      const endX = to.left - container.left;
      const endY = to.top + to.height / 2 - container.top;

      // Create a smooth curved path with gentle arc
      const controlX1 = startX + (endX - startX) * 0.3;
      const controlY1 = startY;
      const controlX2 = startX + (endX - startX) * 0.7;
      const controlY2 = endY;

      const newPath = `M ${startX},${startY} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`;
      setPath(newPath);
    };

    // Generate particles
    const particleArray = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 0.4,
    }));
    setParticles(particleArray);

    updatePath();
    window.addEventListener("resize", updatePath);
    window.addEventListener("scroll", updatePath);

    const interval = setInterval(updatePath, 100);

    return () => {
      window.removeEventListener("resize", updatePath);
      window.removeEventListener("scroll", updatePath);
      clearInterval(interval);
    };
  }, [fromRef, toRef, containerRef]);

  if (!path) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 hidden lg:block"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      {/* Glowing base path */}
      <motion.path
        d={path}
        fill="none"
        stroke="url(#connectionGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.3 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* Flowing particles */}
      {particles.map((particle) => (
        <motion.circle
          key={particle.id}
          r="3"
          fill="url(#particleGradient)"
          initial={{ offsetDistance: "0%", opacity: 0 }}
          animate={{
            offsetDistance: ["0%", "100%"],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            offsetPath: `path('${path}')`,
          }}
        >
          <animateMotion dur="3s" repeatCount="indefinite" begin={`${particle.delay}s`}>
            <mpath href="#connectionPath" />
          </animateMotion>
        </motion.circle>
      ))}

      {/* Hidden path for animation reference */}
      <path id="connectionPath" d={path} fill="none" />

      {/* Gradient definitions */}
      <defs>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="particleGradient">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
