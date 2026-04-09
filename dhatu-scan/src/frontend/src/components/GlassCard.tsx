import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

interface GlassCardProps
  extends Omit<HTMLMotionProps<"div">, "children" | "animate"> {
  children: ReactNode;
  variant?: "default" | "elevated" | "subtle" | "bordered";
  glow?: "none" | "teal" | "green" | "blue";
  hover?: boolean;
  animate?: boolean;
  delay?: number;
}

export default function GlassCard({
  children,
  variant = "default",
  glow = "none",
  hover = false,
  animate: shouldAnimate = false,
  delay = 0,
  className,
  ...props
}: GlassCardProps) {
  const baseStyles = "rounded-xl relative overflow-hidden";

  const variantStyles: Record<string, string> = {
    default: "glass-card",
    elevated: "glass-card card-elevated",
    subtle: "bg-white/3 border border-white/8 backdrop-blur-sm",
    bordered: "bg-transparent border border-primary/30 backdrop-blur-sm",
  };

  const glowStyles: Record<string, string> = {
    none: "",
    teal: "shadow-glow-teal",
    green: "shadow-glow-green",
    blue: "shadow-glow-blue",
  };

  const hoverStyles = hover
    ? "transition-smooth cursor-pointer hover:border-white/20 hover:shadow-elevated hover:-translate-y-0.5"
    : "";

  return (
    <motion.div
      className={cn(
        baseStyles,
        variantStyles[variant],
        glowStyles[glow],
        hoverStyles,
        className,
      )}
      initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      viewport={shouldAnimate ? { once: true } : undefined}
      transition={shouldAnimate ? { duration: 0.5, delay } : undefined}
      {...props}
    >
      {/* Inner highlight line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        }}
      />
      {children}
    </motion.div>
  );
}
