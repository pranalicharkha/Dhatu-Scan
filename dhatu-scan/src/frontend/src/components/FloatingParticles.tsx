import { motion } from "motion/react";
import { useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const COLORS = [
  "oklch(0.72 0.18 176 / 0.15)", // teal
  "oklch(0.60 0.15 235 / 0.12)", // blue
  "oklch(0.70 0.19 155 / 0.10)", // green
];

export default function FloatingParticles() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 80 + Math.random() * 200,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 4,
      color: COLORS[i % COLORS.length],
    }));
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* Large background blobs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.72 0.18 176 / 0.12) 0%, transparent 70%)",
          top: "10%",
          left: "5%",
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 15, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.60 0.15 235 / 0.10) 0%, transparent 70%)",
          top: "40%",
          right: "10%",
        }}
        animate={{
          x: [0, -25, 20, 0],
          y: [0, 25, -15, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.70 0.19 155 / 0.08) 0%, transparent 70%)",
          bottom: "20%",
          left: "30%",
        }}
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -10, 20, 0],
          scale: [1, 1.05, 0.98, 1],
        }}
        transition={{
          duration: 14,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
            filter: "blur(8px)",
          }}
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: p.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
