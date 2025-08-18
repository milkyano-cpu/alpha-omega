"use client";

import * as React from "react";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils"; // or replace with your own classNames util

type PlusCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

export function PlusCheckbox({
  checked,
  onCheckedChange,
  className,
  disabled,
  ...rest
}: PlusCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onCheckedChange(!checked);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-md border",
        "w-6 h-6",
        "transition-all duration-150",
        checked
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-300 bg-white text-gray-500 hover:border-gray-400",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {checked ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Plus className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
