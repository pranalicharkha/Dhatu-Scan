import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  label = "Loading...",
  className,
}: LoadingSpinnerProps) {
  const sizes = {
    sm: { outer: 32, inner: 24, stroke: 3 },
    md: { outer: 56, inner: 40, stroke: 4 },
    lg: { outer: 80, inner: 60, stroke: 5 },
  };
  const s = sizes[size];

  return (
    <div
      className={cn("flex flex-col items-center gap-3", className)}
      aria-label={label}
      aria-live="polite"
    >
      <div className="relative" style={{ width: s.outer, height: s.outer }}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-t-2 border-r-2"
          style={{
            borderColor: "oklch(0.72 0.18 176)",
            borderTopColor: "oklch(0.72 0.18 176)",
            borderRightColor: "oklch(0.72 0.18 176 / 0.3)",
            borderBottomColor: "transparent",
            borderLeftColor: "transparent",
            borderWidth: s.stroke,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        {/* Inner ring — counter rotate */}
        <motion.div
          className="absolute rounded-full border-t-2"
          style={{
            inset: (s.outer - s.inner) / 2,
            borderColor: "oklch(0.70 0.19 155 / 0.6)",
            borderTopColor: "oklch(0.70 0.19 155)",
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftColor: "transparent",
            borderWidth: s.stroke - 1,
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        {/* Center pulse dot */}
        <motion.div
          className="absolute rounded-full bg-primary"
          style={{
            width: 6,
            height: 6,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>
      {label && (
        <motion.p
          className="text-muted-foreground text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
