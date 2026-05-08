"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Modal({ onClose, title, children, wide, size }) {
  const maxWidth = size === "lg" ? "!max-w-3xl" : wide ? "!max-w-3xl" : "";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const content = (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-wrapper" onClick={onClose}>
        <div
          className={`modal-content ${maxWidth}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );

  if (!mounted) return null;

  return createPortal(content, document.body);
}
