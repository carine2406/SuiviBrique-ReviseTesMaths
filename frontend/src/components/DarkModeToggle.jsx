import { useState, useEffect } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    return (
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <button
      className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-indigo-600 transition-all"
      onClick={() => setDark((d) => !d)}
      title={dark ? "Mode clair" : "Mode sombre"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
