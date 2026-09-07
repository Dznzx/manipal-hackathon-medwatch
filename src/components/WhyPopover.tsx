"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

export default function WhyPopover({ title, lines }: { title: string; lines: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        type="button"
      >
        <HelpCircle size={13} />
        <span className="underline decoration-dotted underline-offset-2">Why?</span>
      </button>
      {open && (
        <div
          className="absolute z-50 top-6 right-0 w-72 max-w-[85vw] rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl text-xs leading-relaxed text-slate-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-semibold text-slate-100 mb-1.5">{title}</div>
          <ul className="space-y-1.5">
            {lines.map((l, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
