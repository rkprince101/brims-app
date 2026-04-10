"use client";

import { X } from "lucide-react";

export default function Modal({ onClose, title, children, wide }) {

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${wide ? "!max-w-3xl" : ""}`}
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
  );
}
