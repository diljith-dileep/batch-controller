"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-500 text-[#07030f] shadow-[0_0_26px_rgba(34,211,238,0.45),0_12px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_0_44px_rgba(217,70,239,0.65)]",
  secondary:
    "border border-cyan-300/30 bg-white/[0.04] text-cyan-100 shadow-[inset_0_0_20px_rgba(34,211,238,0.08),0_0_18px_rgba(34,211,238,0.12)] backdrop-blur-md hover:border-cyan-300/60 hover:bg-cyan-300/10",
  danger:
    "border border-rose-400/40 bg-rose-500/10 text-rose-100 shadow-[0_0_22px_rgba(244,63,94,0.22)] backdrop-blur-md hover:border-rose-300/80 hover:bg-rose-500/20",
  ghost:
    "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent",
};

export function NeonButton({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...rest
}: NeonButtonProps) {
  return (
    <button
      type={type}
      className={`group relative inline-flex w-full select-none items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3.5 font-display text-sm font-black uppercase tracking-[0.22em] transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {variant === "primary" ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.6)_50%,transparent_70%)] transition-transform duration-700 group-hover:translate-x-[120%]"
        />
      ) : null}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
