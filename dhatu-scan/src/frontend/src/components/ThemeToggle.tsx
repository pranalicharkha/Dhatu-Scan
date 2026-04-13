import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-smooth hover:-translate-y-0.5 ${
        compact ? "h-10 w-10" : "px-3 py-2"
      }`}
      style={{
        backgroundColor: "var(--card)",
        color: "var(--foreground)",
        borderColor: "oklch(var(--border))",
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {!compact && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </button>
  );
}
