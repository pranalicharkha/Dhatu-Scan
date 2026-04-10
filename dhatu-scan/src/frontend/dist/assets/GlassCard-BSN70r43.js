import { j as jsxRuntimeExports, m as motion, l as cn } from "./index-BzFT_KhA.js";
function GlassCard({
  children,
  variant = "default",
  glow = "none",
  hover = false,
  animate: shouldAnimate = false,
  delay = 0,
  className,
  ...props
}) {
  const baseStyles = "rounded-xl relative overflow-hidden";
  const variantStyles = {
    default: "glass-card",
    elevated: "glass-card card-elevated",
    subtle: "bg-white/3 border border-white/8 backdrop-blur-sm",
    bordered: "bg-transparent border border-primary/30 backdrop-blur-sm"
  };
  const glowStyles = {
    none: "",
    teal: "shadow-glow-teal",
    green: "shadow-glow-green",
    blue: "shadow-glow-blue"
  };
  const hoverStyles = hover ? "transition-smooth cursor-pointer hover:border-white/20 hover:shadow-elevated hover:-translate-y-0.5" : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      className: cn(
        baseStyles,
        variantStyles[variant],
        glowStyles[glow],
        hoverStyles,
        className
      ),
      initial: shouldAnimate ? { opacity: 0, y: 16 } : void 0,
      whileInView: shouldAnimate ? { opacity: 1, y: 0 } : void 0,
      viewport: shouldAnimate ? { once: true } : void 0,
      transition: shouldAnimate ? { duration: 0.5, delay } : void 0,
      ...props,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute top-0 left-0 right-0 h-px",
            style: {
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)"
            }
          }
        ),
        children
      ]
    }
  );
}
export {
  GlassCard as G
};
