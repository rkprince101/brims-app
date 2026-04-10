"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check current theme
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 animate-fade-in text-text-primary">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-sm text-text-secondary">
          Manage your interface preferences
        </p>
      </div>

      <div className="notion-card p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-4 border-b border-border pb-2">Appearance</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">Theme Mode</h3>
            <p className="text-xs text-text-muted mt-1">
              Switch between Light and Dark interface displays.
            </p>
          </div>
          
          <button
            onClick={toggleTheme}
            className="notion-button-primary"
          >
            {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </div>
      </div>
    </div>
  );
}
